# Local Analysis Native TypeScript Migration Delta

This delta applies alongside the accepted current `openspec/specs/local-analysis/spec.md`. Unless explicitly stated below, every current Requirement, Acceptance Criterion, public runtime export, Port method, error, data/security/runtime behavior, and non-requirement remains unchanged.

## REQ-XTS-001 — Closed Native TypeScript Graph

The complete accepted Xanthil production and test graph SHALL cut over one-for-one from `.mjs` to natively executed `.ts` without a compatibility period or runtime namespace change.

- **AC-XTS-001-01:** The final graph contains exactly the eight production and 13 test/helper `.ts` paths enumerated in `exploration.md`; their former `.mjs` paths are absent, and no other Xanthil `.mjs` owner remains. The CSV and separate runner self-test `.mjs` are not renamed.
- **AC-XTS-001-02:** Every relative import/URL in the closed Xanthil graph resolves to its final explicit `.ts` target, and canonical Node executes each of the four `.test.ts` layers without a loader, compiler, or emitted JavaScript.
- **AC-XTS-001-03:** Runtime module namespaces contain exactly the accepted exports named in `proposal.md`; the three Port method sets and dependency direction remain unchanged. Existing Product Core, Port, and Application seams own their shared type-only interfaces. Adapter, Profile, and CLI types remain module-local unless an existing production or test type import has a current consumer for an export. No new module/package/file exists solely for types, and type-only exports add no runtime namespace export.
- **AC-XTS-001-04:** No `allowJs`, `checkJs`, `.mjs` wrapper, dual source owner, loader, `tsx`, bundler, alternate runtime, JavaScript/declaration/source-map emit, `dist`, `build`, or generated migration artifact exists.

## REQ-XTS-002 — Exact Strict No-Emit Toolchain

The root SHALL use one exact, reproducible TypeScript toolchain for strict static checking while Node remains the direct runtime.

- **AC-XTS-002-01:** `package.json` remains private ESM with npm `11.12.1`, Node `>=22.19.0`, Pi `0.84.2`, and TypeBox `1.3.7`; it adds only scripts `typecheck = tsc -p tsconfig.json --noEmit` and `test = tools/harness/validation/run`, plus exact dev dependencies TypeScript `5.9.3` and `@types/node` `22.19.19`. It has no `exports`, `bin`, `start`, `build`, or publication contract.
- **AC-XTS-002-02:** The npm v3 lock root mirrors the exact runtime and dev dependencies, and the locked/installed direct package versions equal the manifest; no runtime dependency or package-manager version changes.
- **AC-XTS-002-03:** One root `tsconfig.json` selects exactly the 21 migrated files and has exactly `strict`, `noEmit`, `target=ESNext`, `module=NodeNext`, `moduleResolution=NodeNext`, `allowImportingTsExtensions`, `erasableSyntaxOnly`, `verbatimModuleSyntax`, `isolatedModules`, `moduleDetection=force`, `noUncheckedSideEffectImports`, and `types=[node]` as specified in `design.md`, with no bridge, skip-lib, emit, lint-like, extend, reference, or alternate-project option.
- **AC-XTS-002-04:** Native syntax checks and `npm run typecheck` exit zero in the canonical environment and create no persistent output or generated artifact.

## REQ-XTS-003 — Accepted Behavior and Boundary Parity

Static migration SHALL preserve the entire accepted `local-analysis` behavior, runtime validation authority, architecture, and executable identity matrix.

- **AC-XTS-003-01:** The exact accepted `AC-XCLI-*` identity set and `TEST-XCLI-001` through `TEST-XCLI-022` identity set remain present and mutually resolved after path migration; no business AC or TEST identity is added, removed, or renamed.
- **AC-XTS-003-02:** All business, failure, security, cancellation, deadline, atomicity, terminal, and provenance assertions remain unchanged and all four layers retain their baseline results—Unit `250`, Contract `198`, Integration `243`, E2E `131` PASS plus one gated skip—except only the approved path/toolchain mechanics inside `TEST-XCLI-021` and `TEST-XCLI-022`.
- **AC-XTS-003-03:** Product Core validators, Port definers, and existing public trust entries accept `unknown` where runtime admission is authoritative and refine internally to seam-owned types. Admitted operational Port/use-case methods and valid results remain strongly typed. TypeScript SHALL NOT replace, bypass, weaken, or pre-satisfy TypeBox, Product Core, Adapter, Port-result, closed-object, error, or security runtime validation; the same invalid runtime inputs fail closed with the same observable semantics.
- **AC-XTS-003-04:** Pi SDK imports and Pi-owned types remain confined to the Pi Adapter. Product Core, Ports, Application, other Adapters, Profile, CLI, tests, and fixtures expose only Xanthil/business or standard platform types at their boundaries.
- **AC-XTS-003-05:** Tests import or derive contracts from production seams and declare no test-owned duplicate business type or interface; approved runtime value fixtures remain unchanged. Runtime-negative values cross validation entries as `unknown` without `any`, repository suppression directives, or broad assertion casts. The only permitted narrow checked conversion is the single Port-contract-fixture helper, with the exact runtime check and negative Contract/Integration consumers specified in `design.md`. Pre-Worker isolation may add `@ts-nocheck` only to mechanical `/private/tmp` production copies to exclude production diagnostics; those copies are non-authoritative, discarded, and never copied back to repository production or tests.

## REQ-XTS-004 — Canonical Offline Validation

The canonical validation entrypoint SHALL make native TypeScript and unchanged product regression one fail-fast offline proof.

- **AC-XTS-004-01:** `tools/harness/validation/run` executes in this exact order: frozen tool versions; exact declared/installed dependency versions; native `.mjs` and `.ts` syntax; strict no-emit typecheck; Unit; Contract; Integration; E2E; unchanged project-board regression.
- **AC-XTS-004-02:** A failed step streams its native output, stops every later step, returns nonzero, and creates no persistent validation result; successful execution returns zero.
- **AC-XTS-004-03:** The runner always removes `XANTHIL_REAL_PI_ACCEPTANCE`; the offline matrix performs no real Pi/model/provider call, and the existing real-model E2E remains one gated skip.
- **AC-XTS-004-04:** `npm test` invokes the canonical runner, while `npm run typecheck` remains a separately invokable check and a named runner phase. The separate existing runner self-test proves the new order and failure behavior.

## REQ-XTS-005 — Non-Destructive Rollback and Data Preservation

Rollback from the native TypeScript graph SHALL restore the accepted baseline without migrating or rewriting product data.

- **AC-XTS-005-01:** Rollback restores the eight production and 13 test/helper module paths, manifest, lock, absence of `tsconfig.json`, and runner behavior from clean commit `a0ab053`; it introduces no dual-read or compatibility mode.
- **AC-XTS-005-02:** Migration and rollback do not change CSV bytes, run schemas, source/artifact data, or user-owned `.xanthil/runs`, and require no data, schema, Artifact, replay, or backfill migration.
