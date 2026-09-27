# Desktop Dependency, Build, and Package Decision

## Decision status

- Decision ID: XDESK-DEP-001
- Status: APPROVED_AND_MAPPED
- User authority: XDESK-DECISION-001 v1.0 items 1, 2, 3, 9, 10, and 11
- Gate position: P1/P2/P3 PASS; P4 adoption/install, bounded compatibility
  correction, canonical baseline, and four Console suites PASS and are retained
  without replay; U1.1 Spec Consistency F1/F2 author return is complete but
  requires complete-package ponytail review, affected Spec Gate and leaf-scoped
  RED/TDD_READY; final P5 remains required

## Active U1.1 loader and first-package dependency decision

No dependency, version, source or lock change is authorized. B1 uses the
approved Node executable's built-in type stripping and `node:module`
`registerHooks`; B2 uses the already installed exact `typescript@5.9.3`,
`react@19.3.0` and `react-dom@19.3.0`; GUI uses the already installed exact
`playwright-core@1.63.0` and Electron/Forge/Vite versions below. No tsx runner,
jsdom, test framework, loader package, browser server, additional module-mock
package or network fetch is permitted.

The sole B1 Node flag is `--experimental-strip-types`. The synchronous
process-local hook maps only the exact bare `electron` import to the approved
external Electron boundary substitute and delegates all other resolution. It
is installed by the existing Test fixture before dynamic import of real Main or
preload. The retained IPC regression uses that same hook and flag, not ambient
Electron, an `--import` preloader, a product environment switch or a rewritten
Main. Hook positive/negative controls must pass independently.

For B2 TSX only, `transpileModule` receives the fixed options in `design.md`,
emits one Test-owned `.mjs` under the command's non-overwriting evidence child,
and records source/output digests. The closed resolver maps bare `react` and
`react/jsx-runtime` to the installed root package bytes;
`react-dom/server` stays a real driver import. Only `react-dom/client.createRoot`
and the DOM root are substituted, including during component import after the
normal mount exists. Unexpected bare or runtime relative imports fail health;
there is no generic resolver or path framework. The production build remains
Forge/Vite; the Test transpilation is neither a production compiler nor package
input.

The current P5 manifest fields/scripts and four build configs remain the only
package contract. B2 may write them only as a prerequisite of the admitted
normal mount/first package, after its leaf-scoped TDD_READY. The existing lock
already contains every exact package and stays byte-frozen. The first package
must be the existing ASAR-backed unsigned darwin/arm64 app at
`out/Xanthil-darwin-arm64/Xanthil.app`, with no makers, publisher, updater,
sign/notary, HMR/devtools production branch or external resource. Typecheck,
package and launch/control failure is health failure, not product RED.

P1/P2/P3 remain approved feasibility evidence. Technical Decision Amendment
001 and the coordinator decision close the separate Desktop Run 3.0 contract
in this package without changing the dependency matrix. The first complete
package passed ponytail/Spec Gate rereview, after which P4 adopted the exact
manifest/lock and completed each authorized installation once. The canonical
baseline then exposed one stale pre-Change root-manifest oracle in
TEST-XCLI-021. The first post-Gate clarification closed the P4/P5 configuration
tuple as `SPEC_READY_CONFIGURATION_CORRECTION_001`. A narrow Test attempt then
showed that its universal package-resolution algorithm over-specified the proof
means. `SPEC_READY_DEPENDENCY_HEALTH_CORRECTION_002` closed that boundary. Both
clarifications are historical and complete: the affected Gate, narrow Test,
canonical baseline, and four Console suites passed, so P4 PASS is retained.
The historical `SPEC_READY_TEST_RECOVERY_CLOSEOUT_001` changed no dependency
decision and replayed no successful install or baseline. Incremental Contract
Amendment 001 supersedes the former temporary-configuration blocker with the
exact finite tuples below.

The earlier pending alternatives and proposed product version 1.0.0 are
historical only. The live decision is the exact matrix below.

## Exact root package contract

The repository remains one private ESM npm package and one npm v3 lockfile.
After approved P4 adoption the root metadata is:

| Field | Exact value |
|---|---|
| name | xanthil-desktop |
| productName | Xanthil |
| version | 0.1.0 |
| private | true |
| type | module |
| packageManager | npm@11.12.1 |
| engines.node | >=22.19.0 |

Existing direct packages remain exact:

| Package | Version | Placement |
|---|---:|---|
| @earendil-works/pi-coding-agent | 0.84.2 | dependencies |
| typebox | 1.3.7 | dependencies |
| @types/node | 22.19.19 | devDependencies |
| typescript | 5.9.3 | devDependencies |

Approved Desktop additions are exactly:

| Package | Version | Placement |
|---|---:|---|
| react | 19.3.0 | dependencies |
| react-dom | 19.3.0 | dependencies |
| electron | 44.4.3 | devDependencies |
| vite | 8.3.0 | devDependencies |
| @vitejs/plugin-react | 6.1.1 | devDependencies |
| @electron-forge/cli | 7.11.2 | devDependencies |
| @electron-forge/plugin-vite | 7.11.2 | devDependencies |
| @types/react | 19.3.0 | devDependencies |
| @types/react-dom | 19.3.0 | devDependencies |
| playwright-core | 1.63.0 | devDependencies, test-only |

No range, latest tag, override, second package manager, nested lock, ORM,
SQLite npm driver, Maker, publisher, updater, postinstall, or additional test
runner is permitted.

## Frozen P4 adoption

After and only after full Spec Gate PASS, the coordinator may adopt these
already-reviewed files byte-for-byte from the external dependency preflight:

| Repository target | Frozen source identity |
|---|---|
| package.json | 808 bytes; SHA-256 5a5e225cab86826b78afb2b94eb18a4064ab75c1115aa27dfb1342a927ed264a |
| package-lock.json | 319836 bytes; SHA-256 861326061cd570b0e81584f149012b13228aec3da6528d82536f89cbb5d535c0 |

The approved lock preserves 652 packages, 1119 dependency edges, and 30 peer
edges. Relative to the earlier candidate, only the six approved Pi-child
integrity lines changed. The P4 coordinator then runs the approved scripts-off
install and the single already-reviewed Electron official binary installer
exception under the exact task-local toolchain. It must recheck adopted bytes,
locked graph, installed versions, the Electron ZIP anchor, and baseline health.
No source, version, lifecycle, or permission change is implied.

P4 does not add Desktop source, build config, package scripts, tests, or
products. A missing build entry at that point is expected and is not RED.

## Incremental finite repository-configuration tuples

The manifest, lock, dependencies, four build configs, HTML/CSS entry, Forge
shape, and package scripts are exactly the final P5 values from the first
packaged U1 build. Only the explicit `tsconfig.json` Desktop appendix and the
Desktop phases in `tools/harness/validation/run` grow. All tuples retain the
original ordered 43 P4 TypeScript paths. The Desktop appendix is always an
ordered subsequence of the final 25 paths below; it is never inferred from the
filesystem.

| Tuple | Exact appended P5 path numbers | Exact runner meaning |
|---|---|---|
| C0 / retained P4 | none | retained P4 runner and historical PASS only |
| C1a / U1.1 shell | 3, 10–18, 22, 25 | retained phases plus IPC/Main/preload/Renderer shell and refusal selectors; no business Port/Profile |
| C1b / U1.2–U1.4 | 1–6, 9–19, 22, 23, 25; omit exactly 7, 8, 20, 21, 24 | C1a plus admitted Store/Application/Profile U1 selectors |
| C1 / U1.5 checkpoint | 1–6, 9–19, 22–25; omit exactly 7, 8, 20, 21 | C1b plus owner-crash/reopen integration selector |
| C2 / U2 and U3 | 1–20 and 22–25; omit exactly 21 | C1 plus admitted U2 selectors; U3 selectors are added without a graph change |
| C3 / U4 | all 1–25 | admitted U1–U4 selectors; unproved final/manual leaves remain pending |
| CF / final | all 1–25 | no selector subset: four Console commands then full Desktop unit, contract, integration, and E2E commands |

For avoidance of doubt, C1a expands to final-list entries
`3,10,11,12,13,14,15,16,17,18,22,25`; C1b expands to
`1,2,3,4,5,6,9,10,11,12,13,14,15,16,17,18,19,22,23,25`; C1 expands to
final-list entries
`1,2,3,4,5,6,9,10,11,12,13,14,15,16,17,18,19,22,23,24,25`; C2 expands to
`1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,22,23,24,25`.
The exact twelve compiler options stay unchanged in C1/C2/C3/CF except the one
addition `jsx:"react-jsx"`. The recognized repository-config inventory is the
same sorted seven-item P5 inventory in every C1–CF tuple. `package-lock.json`
never changes.

During incremental execution, TEST-XCLI-021's independent literal helper/body
may recognize exactly C0, C1a, C1b, C1, C2, or C3/CF and must reject every mixed, partial,
extra, omitted, reordered, or actual-as-oracle state. Its old business and
negative assertions remain; TEST-XCLI-022 and lock checks are untouched. The
Test role owns only that helper/body/oracle change. The Worker owns the matching
manifest/tsconfig/build/runner implementation after loop-scoped TDD_READY. At
final retirement, the C1a/C1b/C1/C2 oracle cases and intermediate focused
runner command list are deleted/replaced, leaving the original exact
P4-or-final-P5 recognition and full runner. The runner has no runtime branch,
phase argument or environment selector: each source revision contains one
literal ordered command list for its admitted loops.

## Historical Execution Reslice 001 configuration blocker — superseded

Before the activated amendment, no temporary configuration tuple was approved.
Exact P4 remained the only active
state and exact P5 below remains the only final state. A finite manifest and
tsconfig sequence can be enumerated, but it cannot be proven buildable without
either changing the frozen public factory/Port signatures or implementing
future U2/U4 production behavior before its causal RED. TEST-XCLI-021 and the
validation runner therefore remained closed. The activated amendment and the
C0/C1a/C1b/C1/C2/C3/CF contract above supersede only that historical restriction; no
downstream write is authorized before Gate and loop-scoped TDD_READY.

## Frozen P5 manifest delta

After valid RED/TDD_READY, the Worker may add only these package.json fields;
the dependency sets and lock graph remain unchanged:

- main: .vite/build/main.js
- config: exactly `{ "forge": "./forge.config.cjs" }`
- scripts.desktop:start:
  node tools/desktop/prepare-toolchain-deployment.mjs && electron-forge start
- scripts.desktop:package:
  node tools/desktop/prepare-toolchain-deployment.mjs && electron-forge package --platform=darwin --arch=arm64
- scripts.desktop:test:
  npm run desktop:package && node --test tests/unit/xanthil-desktop/*.test.ts tests/contract/xanthil-desktop/*.test.ts tests/integration/xanthil-desktop/*.test.ts tests/e2e/xanthil-desktop/*.test.ts

Existing typecheck and test scripts retain their current meaning. The P5 change
also adds only `jsx: "react-jsx"` to `compilerOptions` and appends only the
exact new TypeScript files named below to the root tsconfig `files` list. The
canonical validation runner currently omits the
unchanged run-evidence-console suites; P5 appends, in order, the existing unit,
contract, integration, and E2E Console phases and then the new Desktop phases.
No unbounded include/glob, skipped compatibility suite, or skip-lib bypass is
permitted.

## Closed P4/P5 root-configuration states

TEST-XCLI-021 SHALL recognize exactly two complete repository-configuration
states. It compares parsed values only to literals frozen by this decision; it
must not construct expected values from `package.json`, `package-lock.json`,
`tsconfig.json`, directory contents, or an implementation-produced manifest.

### P4 state

- `package.json` is the exact 808-byte/SHA-256 object above, including all four
  retained direct packages, all ten Desktop additions, the unchanged
  `typecheck`/`test` scripts, and no other key.
- `package-lock.json` remains the exact P4 lock. Its root entry is exactly
  `{name:"xanthil-desktop",version:"0.1.0",dependencies:<the exact four-entry
  dependency object>,devDependencies:<the exact ten-entry devDependency
  object>,engines:{node:">=22.19.0"}}`; all fourteen direct lock entries have
  the exact versions in this document.
- `tsconfig.json` remains the exact 3060-byte, SHA-256
  `869a4455182d011fd3dd23f15d93525424b197d6feb390be90deca0889125657`
  P4 object. Its existing twelve compiler options and 43 ordered `files`
  entries are retained exactly from the pre-Desktop TEST-XCLI-021 literal.
- The exact recognized repository-configuration inventory is
  `package-lock.json`, `package.json`, and `tsconfig.json`.

### P5 state

The P5 manifest is the exact P4 manifest plus only `main`, the one-key nested
`config` object, and the three Desktop scripts above. Dependencies,
devDependencies, engine, package manager, existing scripts, name, productName,
version, private, and type are byte-value invariant. The lock root and all
direct/transitive versions are unchanged from P4.

The P5 `tsconfig.json` is the exact P4 object with only
`compilerOptions.jsx: "react-jsx"` added and these 25 paths appended, in this
order, after the retained 43 entries:

1. `packages/product-core/xanthil-desktop-decision-case.ts`
2. `packages/application/xanthil-desktop-decision-case.ts`
3. `packages/contracts/xanthil-desktop-ipc.ts`
4. `packages/ports/xanthil-desktop-decision-case.ts`
5. `adapters/storage-local/xanthil-desktop-schema.ts`
6. `adapters/storage-local/xanthil-desktop-decision-case.ts`
7. `adapters/analytics-duckdb/local-analysis-process.ts`
8. `adapters/analytics-duckdb/xanthil-desktop-decision-case.ts`
9. `profiles/personal/xanthil-desktop.ts`
10. `apps/desktop/main.ts`
11. `apps/desktop/preload.ts`
12. `apps/desktop/renderer.tsx`
13. `tests/fixtures/xanthil-desktop/coverage-map.ts`
14. `tests/fixtures/xanthil-desktop/desktop-contract-drivers.ts`
15. `tests/fixtures/xanthil-desktop/desktop-e2e-harness.ts`
16. `tests/fixtures/xanthil-desktop/desktop-fixtures.ts`
17. `tests/unit/xanthil-desktop/xanthil-desktop.unit.test.ts`
18. `tests/unit/xanthil-desktop/coverage-map.test.ts`
19. `tests/contract/xanthil-desktop/xanthil-desktop-store.contract.test.ts`
20. `tests/contract/xanthil-desktop/xanthil-desktop-analysis.contract.test.ts`
21. `tests/contract/xanthil-desktop/xanthil-desktop-assistance.contract.test.ts`
22. `tests/contract/xanthil-desktop/xanthil-desktop-ipc.contract.test.ts`
23. `tests/integration/xanthil-desktop/xanthil-desktop-application.integration.test.ts`
24. `tests/integration/xanthil-desktop/xanthil-desktop-storage.integration.test.ts`
25. `tests/e2e/xanthil-desktop/xanthil-desktop.e2e.test.ts`

The P5 recognized repository-configuration inventory is exactly the three P4
files plus `forge.config.cjs`, `vite.main.config.mjs`,
`vite.preload.config.mjs`, and `vite.renderer.config.mjs`, compared as a sorted
seven-item list. The four build files remain content-validated by
TEST-XDESK-011; TEST-XCLI-021 owns only their closed repository inventory.

### Compatibility-oracle behavior

The test keeps independent literal P4/P5 root-manifest, tsconfig, lock, and
configuration-inventory expectations. It classifies only an exact P4 or exact
P5 manifest; the selected phase must match the exact tsconfig and
configuration-file list. P4-manifest/P5-config, P5-manifest/P4-config, partial
P5, and any third shape fail.

`assertApprovedLock` compares the lock to the frozen dependency/version
literals, not to unvalidated actual-manifest values. It retains the existing
four direct-package checks and adds the ten approved Desktop direct entries,
exact root `name`/`version`/`engines`, and exact dependency/devDependency
objects.

### Dependency-health proof contract

For every direct package, the compatibility proof SHALL establish the approved
exact name/version and lock source/integrity, actual installation beneath this
Project's `node_modules` with no global fallback, and the package entry
capability required by this Change. Independent expected literals remain the
oracle; actual manifest, lock, package metadata, resolved paths, or directory
contents SHALL NOT construct an expected value. Package metadata identity alone
does not prove that a required module, declaration, executable, or build entry
is present and locally usable, and a package SHALL NOT be required to expose an
entry kind that its approved role does not require.

Within the single Test file and execution boundary in path-contract.md, the
formal Test role may select or replace a package-appropriate, equivalent
read-only/local proof method without another Spec return when it preserves all
of those outcomes, independent literals, assertions, and negative cases. Such
a method SHALL NOT mutate package, lock, config, source, or installed bytes;
invoke a dependency CLI for side effects; install or fetch anything; use a
network/provider; fall back outside the Project; or weaken the exact P4/P5
tuples. The retained P3 build/launch proof and later P5 package/build/launch
acceptance remain separate evidence and are neither replaced nor replayed by
this focused dependency-health check.

Every existing negative mutation remains: unexpected dependency, ranged Pi,
wrong typebox/npm/TypeScript versions, replacement scripts, and unknown root
`build`. Add negative mutations for each new root field/script category,
React/Electron/build/test dependency drift, lock-root metadata/direct-entry
or source/integrity drift, missing/unusable required entry capability,
non-Project fallback,
metadata-only false success, missing/extra/reordered tsconfig path,
wrong/missing `jsx`, extra compiler option, extra/missing build config, and both
mixed-phase tuples. No subset comparison, skip mask, wildcard,
actual-as-oracle, or environment-based branch is permitted. TEST-XCLI-022 and
its original native-path/no-compatibility-artifact assertions remain unmodified.

## Build configuration

The only build configuration is:

- forge.config.cjs
- vite.main.config.mjs
- vite.preload.config.mjs
- vite.renderer.config.mjs

Forge uses @electron-forge/plugin-vite for Main, preload, and one renderer named
main_window. Packaging uses ASAR, an empty makers list, no native rebuild
modules, platform darwin, architecture arm64, and output
out/Xanthil-darwin-arm64/Xanthil.app. Vite bundles local resources only and
resolves packaged assets relatively. Development HMR/devtools behavior is not
present in the packaged production path.

The generated local deployment descriptor is prepared by
tools/desktop/prepare-toolchain-deployment.mjs from the exact
JUANERAI_TOOLCHAIN_BIN supplied by the coordinator. It verifies executable
DuckDB 1.5.2 and Python >=3.9 paths and versions, then writes only:

- schema_version, fixed 1.0;
- duckdb.executable_path and duckdb.version;
- python.executable_path and python.version.

The build-local source is build/xanthil-toolchain-deployment.json; Forge copies
it into Xanthil.app/Contents/Resources/toolchain-deployment.json. Neither path
is tracked, placed in a Project, shown to the Renderer, sent to a provider, or
included in a report. The Personal Desktop Profile reads only the packaged
descriptor. Missing, malformed, non-executable, or version-drifted entries make
local calculation unavailable; the product does not search PATH, read shell rc,
install tools, or select an alternative executable.

## Package and security boundary

The only deliverable is a local unsigned/unnotarized Mac mini arm64 .app.
There is no DMG, ZIP, PKG, x64/universal artifact, signing, notarization,
updater, publisher, or public release.

Packaged BrowserWindow preferences are fixed:

- nodeIntegration false;
- contextIsolation true;
- sandbox true;
- local resources only;
- restrictive CSP without unsafe-eval;
- no arbitrary navigation, new windows, permission requests, external URL
  opening, or unapproved network.

The preload exposes only closed named business methods. Main validates
sender/frame, IPC contract version, exact shape, ownership, lifecycle state,
and authorization before an effect.

## E2E driver contract

Automated Desktop E2E uses playwright-core 1.63.0 with node:test to launch the
actual packaged executable at:

out/Xanthil-darwin-arm64/Xanthil.app/Contents/MacOS/Xanthil

The launch has chromiumSandbox true, no no-sandbox flag, and no CSP bypass.
Test-only debugger arguments may enable Playwright attachment but create no
product debug IPC, default remote-debugging setting, or data injection API.

Offline Assistance contract/integration coverage injects a closed
`DecisionAssistanceRuntime` double only through the public lower-level
Profile/Application business-Port composition factory, with real Application,
store, SQLite, and Project files. It creates real pending Draft and failed
Attempt state in a synthetic Project, then closes every writer. The same frozen
production `.app` subsequently opens that Project through its real Main,
production Profile, preload, IPC, and Renderer and proves visible edit/adopt/
reject/manual-fallback/reopen behavior. This does not claim that production
Main called a Provider. No second app package, test Electron entry, product
selector, environment override, or arbitrary transport is built. Pi Adapter
contract evidence remains separately attributed.

A separate normal user-path acceptance opens the same frozen .app without
debugging arguments, uses the native Project and two-file choosers, completes
the full local workflow, saves, exits, and reopens. A dev server, browser page,
source entry, substituted chooser, or provider double cannot replace this
normal-launch evidence.

## Feasibility evidence and limitations

P1/P2/P3 proved the locked graph, installed bytes, official Electron archive,
Forge/Vite/React packaging, Playwright attachment, Renderer isolation/CSP, and
file-backed node:sqlite lifecycle in Node 26 and Electron 44.4.3. Current
authority is p3-final-coverage-001.json; it supersedes the premature full-P3
claim in p3-independent-002.json while preserving the latter's valid partial
assertions.

These are synthetic feasibility probes only. They are not the product schema,
six-stage E2E, normal no-debug launch, expected RED, GREEN, real provider
acceptance, or Spec Gate PASS.
