# Xanthil Native TypeScript Migration Proposal

## Change

- Change ID: `CHG-xanthil-typescript-migration`
- Correction: `SPEC-CORRECTION-001` — public TypeScript interface ownership after rejected TDD_READY
- Capability: `local-analysis`
- Classification: boundary change, R2 evidence
- Difficulty: complex for this correction because the first Test pass exposed an unfrozen cross-role type boundary
- Delivery path: full Change workflow
- Accountable user: Data Analyst
- Rollback baseline: clean commit `a0ab053`

This is a development/runtime-language boundary change across the accepted Xanthil module graph. It intentionally changes repository paths, native module loading, static checking, and validation mechanics. It SHALL NOT change any accepted `local-analysis` product behavior.

## Why Now

ADR 0002 requires the transitional `.mjs` first slice to move to TypeScript before a second business slice. Delaying the cutover would create a mixed-language ownership boundary and make later product work pay migration and behavior-change risk at the same time.

## Objectives

- Product objective: preserve the accepted Xanthil Data Analyst journey and every accepted failure, security, timing, atomicity, and provenance behavior exactly.
- Delivery objective: cut the complete Xanthil graph from `.mjs` to natively executed `.ts`, with one strict no-emit typecheck and no bridge or generated JavaScript.
- Learning objective: prove that the canonical Node runtime, Pi `0.84.2` declarations, TypeBox `1.3.7`, the four Xanthil test layers, and the offline validation harness work together under strict erasable TypeScript.

## Scope

The closed migration graph contains 21 current `.mjs` files:

- eight production modules: Product Core, Ports, Application, Pi Adapter, DuckDB/Python Adapter, local Artifact Adapter, personal Profile, and CLI;
- five executed test files across Unit, Contract, Integration, and E2E, including the Unit coverage-map test; and
- eight Xanthil fixture/helper modules.

The earlier `12 = 4 suites + 8 helpers` inventory conflated four test layers with test-file count. Repository evidence establishes 13 test-side files, so the approved in-scope total is 8 production plus 13 test/helper files. This corrects path arithmetic only; it adds no behavior.

The Change also updates the root npm manifest and lock, adds one root `tsconfig.json`, and updates the canonical validation runner plus its existing focused self-test.

## Reused Unchanged Authority

`openspec/specs/local-analysis/spec.md` remains authoritative in full. This Change reuses all `REQ-XCLI-001` through `REQ-XCLI-016`, the exact current set of 54 unique `AC-XCLI-*` criteria, the stable failure vocabulary, the fixture bytes and oracle, the run and Artifact contracts, all Port method sets, and all runtime/data/security/timing/cancellation/atomicity/provenance semantics without a delta.

The runtime module namespaces remain exactly:

- Product Core: `createLocalAnalysisDomain`;
- Ports: `defineAgentAnalysisRuntime`, `defineLocalAnalysisExecution`, `defineRunArtifactStore`;
- Application: `createLocalAnalysisApplication`;
- Adapters: `createPiAgentAnalysisRuntime`, `createDuckDbPythonLocalAnalysisExecution`, `createLocalRunArtifactStore`;
- personal Profile: `createPersonalLocalAnalysisProfile`; and
- CLI: `runXanthil`.

The three Port method sets remain exactly as accepted: Agent Analysis Runtime has `preflightModel` and `openSession`; Local Analysis Execution has `preflightApprovedFixture`, `profileApprovedFixture`, `calculateMemberRepurchaseMetrics`, and `validateMemberRepurchaseMetrics`; Run Artifact Store has `preflightRunRoot`, `beginRun`, `commitConfirmedContract`, `appendAsset`, `replaceManifest`, `commitSuccess`, and `readTerminalRun`.

## Approved Technical Decisions

1. Node executes `.ts` directly through its stable native type stripping. There is no compile, emit, `dist`, loader, `tsx`, bundler, or alternate runtime.
2. The only new packages are exact dev dependencies `typescript` `5.9.3` and `@types/node` `22.19.19`. Runtime dependencies remain Pi `0.84.2` and TypeBox `1.3.7`.
3. One root strict/no-emit configuration uses the exact compiler options in `design.md`; there is no `allowJs`, `checkJs`, `skipLibCheck`, or lint-like addition.
4. Root package shape stays private ESM on npm `11.12.1` with `engines.node >=22.19.0`. It adds only `scripts.typecheck`, `scripts.test`, and the two exact dev dependencies.
5. The canonical offline runner checks frozen tools, dependency versions, native `.mjs`/`.ts` syntax, strict typecheck, the four Xanthil layers, then the unchanged project-board regression. It always removes the real-model gate.
6. Static types supplement but never replace the existing TypeBox and fail-closed runtime validators. Pi SDK types stay inside the Pi Adapter.

## Spec Correction 001 — Type Interface Ownership

The post-Gate Test pass proved native syntax, coverage-map health, and the causal missing-production/toolchain RED, but an isolated strict test-side compile failed with 1,174 diagnostic lines. The failures were not one missing annotation class: they combined standalone implicit-`any` callbacks, deliberate invalid runtime values rejected by positive literal inference, and Application/Port doubles with no production-owned TypeScript surface. TDD_READY was correctly rejected.

The correction keeps the existing deep-module seams and freezes ownership:

- Product Core owns shared type-only interfaces for its business values and validator refinements; Ports own their capability interfaces; Application owns its shared dependencies, use-case handle, and result interfaces. Adapter, Profile, and CLI implementation types remain module-local by default; one of those modules exports a type only when an existing production or test type import has a current consumer.
- No new module, package, file, schema, or runtime export exists solely to hold types. Type-only exports disappear at runtime, and the exact runtime namespaces remain unchanged.
- Runtime validators and public trust-entry parameters admit `unknown` and refine internally. After admission, Xanthil-owned values, Port implementations, session handles, and operational results remain strongly typed.
- Tests import or derive contracts from production seams with `import type`, `typeof import`, `Parameters`, `ReturnType`, and `Awaited`; they do not declare a test-owned business type or interface. Approved runtime value fixtures remain unchanged. Test-mechanical types may use only `unknown`, standard platform types, or those derived public types.
- Runtime-negative tests pass invalid values through `unknown`. They use no `any`, suppression directive, or broad assertion cast. The sole permitted narrow conversion is the runtime-checked negative-invocation helper specified in `design.md`, owned by the existing Port-contract fixture and consumed only by negative Port/Adapter contract leaves.

This correction changes static ownership only. It does not widen a runtime contract, make an invalid value valid, add behavior, or alter any of the six approved technical decisions.

## Out of Scope

- Any product behavior, Requirement, Acceptance Criterion, Port method, runtime export, error, data shape, model/runtime choice, deadline, cancellation race, persistence, Artifact, security, or provenance change.
- Any second business slice or new user scenario.
- `allowJs`, `checkJs`, dual `.mjs`/`.ts` ownership, compatibility wrappers, generated declarations, JavaScript emit, source maps, build output, publication, `exports`, `bin`, `start`, or `build` contracts.
- Runtime dependency/version changes, package-manager changes, new lint rules, or broad harness redesign.
- CSV byte changes, data/schema/artifact migration, or modification of user-owned `.xanthil/runs`.
- Any real Pi, model, provider, or network call.

## Path Policy

### Spec role — current Change only

Allowed: `openspec/changes/xanthil-typescript-migration/**`.

### Test role — after Spec Gate

Allowed: the 13 Xanthil test/helper paths enumerated in `exploration.md`, renamed one-for-one to `.ts`, with only typing, production-derived type imports, the one bounded negative-invocation helper, and necessary path/module/execution mechanics; and `tools/harness/validation/run.test.mjs` for the currently executed runner contract `node --test tools/harness/validation/run.test.mjs`.

Forbidden: production, root manifest/lock/config, canonical runner, current spec/archive, CSV, project-control, and business assertion changes.

### Worker role — after TDD_READY

Allowed: the eight production `.mjs` paths enumerated in `exploration.md`, renamed one-for-one to `.ts`, supplying the Product Core/Port/Application shared type interfaces, and keeping Adapter/Profile/CLI implementation types module-local unless an existing production or test type import consumes an export; `package.json`; `package-lock.json`; new `tsconfig.json`; and `tools/harness/validation/run`.

Forbidden: all tests and helpers including the runner self-test, CSV, current spec/archive, project-control, every other product or documentation path, build output, generated files, and Git state.

No Test or Worker may retain a permanent bridge or dual module system as a workaround. A cross-owner type-contract conflict returns to the Controller rather than crossing the frozen write sets.

## Activation and Rollback

Activation follows the lifecycle and evidence tasks in `tasks.md`.

Rollback restores the source/module paths, `package.json`, `package-lock.json`, `tsconfig.json` absence, and validation runner from clean commit `a0ab053`. It performs no data/schema/artifact migration and SHALL NOT delete or rewrite user-owned Xanthil runs.

## Stop Lines

Return to the Controller on any observable behavior or contract delta; Pi/model/data/persistence/timeout/cancellation/atomicity/security change; second runtime, bridge, build, or package-publication mechanism; broad harness redesign; business assertion change; type correction that changes runtime semantics; or evidence/spec/baseline conflict.

## Evidence Level

R2 requires causal expected RED with a healthy environment, isolated test-side type health against mechanically copied production modules whose scratch copies alone exclude production diagnostics, final strict 21-file no-emit typecheck after Worker supplies production interfaces, affected Adapter contracts, all four Xanthil layers, stable TEST/AC identity and assertion-count parity, runner self-test, full canonical offline regression, scope/traceability review, absence of model calls and build artifacts, and fresh independent validation.
