# Design

## Design Summary

Rename the closed Xanthil module graph one-for-one, add erasable static types that express existing runtime contracts, execute the `.ts` files directly with Node, and add one strict no-emit typecheck. No compiled artifact or compatibility layer exists.

## Architecture

The dependency graph and ownership remain:

`CLI -> Application -> Product Core`

`Application -> Ports <- Adapters`

`personal Profile -> Application + concrete Adapters`

No infrastructure SDK type may enter Product Core or Application. Pi SDK types are imported and used only in `adapters/agent-pi/local-analysis.ts`. Business-facing Port signatures use Xanthil-owned structural types. Type-only exports needed by this closed graph may describe existing runtime values and method signatures, but SHALL add no runtime namespace export and SHALL NOT widen or narrow the values accepted by the authoritative runtime validators.

### Existing-Seam Type Ownership

- Product Core owns the type-only business values returned by, or refined through, `createLocalAnalysisDomain`.
- Ports own the Agent Analysis Runtime, Local Analysis Execution, and Run Artifact Store interfaces, including their admitted command/result/session shapes.
- Application owns its dependency interface, start input admission, returned use-case handle, and terminal/result shapes.
- Adapter, Profile, and CLI config, invocation, and result types remain module-local by default. Such a module exports a type only when an existing production or test type import has a current consumer.

The shared Product Core, Port, and Application interfaces live in their existing production files; consumer-required leaf types remain in their owning Adapter, Profile, or CLI file. There is no `types.ts`, declaration-only source, schema package, shared test contract, or other new type layer. Production modules may use type-only imports from their existing dependency seams; runtime dependency direction and `Object.keys()` namespaces remain unchanged.

## Native TypeScript Rules

- Every Xanthil relative module specifier names the final `.ts` file explicitly.
- Node `26.0.0` executes production and tests directly; `node --check` checks both retained tooling `.mjs` and migrated Xanthil `.ts`.
- Production and test syntax stays within Node-erasable TypeScript, enforced by `erasableSyntaxOnly`.
- There is no compile step, output directory, JavaScript emit, declaration emit, source map, loader, `tsx`, bundler, or second runtime.
- There is no `.mjs` compatibility wrapper, `allowJs`, `checkJs`, or dual source ownership.

## Root TypeScript Configuration

The new root `tsconfig.json` is one closed configuration whose `compilerOptions` are exactly:

```json
{
  "strict": true,
  "noEmit": true,
  "target": "ESNext",
  "module": "NodeNext",
  "moduleResolution": "NodeNext",
  "allowImportingTsExtensions": true,
  "erasableSyntaxOnly": true,
  "verbatimModuleSyntax": true,
  "isolatedModules": true,
  "moduleDetection": "force",
  "noUncheckedSideEffectImports": true,
  "types": ["node"]
}
```

It SHALL have no `extends`, `references`, alternate project, `allowJs`, `checkJs`, `skipLibCheck`, emit, declaration, source-map, lint-like, or build option. Its file selection SHALL cover exactly the 21 migrated Xanthil files; retained repository `.mjs` tooling, including project-board and runner tests, is outside typecheck ownership.

## Root Package Contract

`package.json` remains a private ESM package with npm `11.12.1`, Node engine `>=22.19.0`, and exact runtime dependencies Pi `0.84.2` plus TypeBox `1.3.7`. It adds only:

```json
"scripts": {
  "typecheck": "tsc -p tsconfig.json --noEmit",
  "test": "tools/harness/validation/run"
},
"devDependencies": {
  "@types/node": "22.19.19",
  "typescript": "5.9.3"
}
```

The npm v3 lock root mirrors both exact dev dependencies, and their installed/locked package versions are exact. There is no `exports`, `bin`, `start`, `build`, or publication contract.

## Runtime Validation and Type Authority

TypeScript catches static inconsistencies inside the trusted source graph. Existing Product Core validators, TypeBox tool schemas, Adapter input/output validation, closed enum/error checks, and fail-closed trust boundaries remain runtime authority. A static type assertion SHALL NOT be used to skip, weaken, replace, or pre-satisfy one of those checks.

Product Core validator methods, Port definers, and existing public trust entries such as Application start, Adapter/Profile construction, and CLI invocation accept `unknown` where the current implementation performs runtime admission. They refine internally to seam-owned types and return typed values or typed handles. Once a Port implementation or use-case handle is admitted, its valid operational methods keep strongly typed inputs and outputs; `unknown` is not propagated through normal business flow merely to accommodate tests.

Type annotations SHALL preserve current object key order, canonical serialization, thrown error codes/stages, frozen/mutable ownership, signal identity, timing, and side effects. `any`, broad casts, or suppression directives used to evade a real mismatch are not an acceptable migration mechanism. A mismatch that cannot be typed without semantic change triggers the stop line.

### Deliberate Invalid Runtime Values

Domain-validator, Application-start, factory/config, Profile, and CLI negative cases pass their deliberate invalid value as `unknown` to the corresponding trust entry. Negative Port/Adapter contract leaves target already admitted, strongly typed operational methods and therefore use one test-mechanical helper in `tests/fixtures/xanthil-local-analysis/port-contracts.ts`:

- the helper accepts a callable as `unknown` plus `readonly unknown[]` arguments;
- it first proves `typeof callable === 'function'` at runtime;
- only after that check it performs one local assertion to `(...args: unknown[]) => unknown` and invokes the function;
- only Contract/Integration leaves that prove an operational Port or Adapter rejects malformed runtime input may consume it; and
- it cannot define a business shape, coerce a result to a success type, or be used by positive-path production calls.

No other blanket cast permission exists. Test-local record/array mutation helpers must refine from `unknown`, use standard platform types such as `Record<string, unknown>`, or derive from production types; they may not duplicate a Xanthil business interface.

## Test Migration and TDD Separation

The Test role owns all 13 test/helper renames and typing plus the existing runner self-test. It changes only:

- import paths and URL targets from the owned `.mjs` graph to `.ts`;
- type-only imports/derivations from the existing production seams and annotations needed for strict TypeScript;
- the bounded negative-invocation helper above;
- `TEST-XCLI-021` toolchain expectations;
- `TEST-XCLI-022` exact path/native-TypeScript/no-artifact expectations; and
- runner self-test fixtures/observations required to freeze the new runner order.

It SHALL preserve test titles/identities, business inputs, mutation leaves, assertions, negative cases, and expected counts except the explicitly approved mechanics leaves. It may define only test-mechanical types derived from `unknown`, standard platform types, or production seam types; it may not establish a test-owned business contract.

Before Worker, isolated type-health evidence uses mechanical `/private/tmp` copies of the real production modules and the migrated test/helper files. Only the scratch production copies may receive `@ts-nocheck`, solely to exclude the intentionally missing production diagnostics while preserving their actual signatures and inference for test diagnostics. Repository production/tests receive no suppression, the scratch copies are discarded and non-authoritative, and final authority remains the strict post-Worker 21-file typecheck.

The Worker owns the production seam interfaces, production typing, manifest/lock/config, and runner implementation only. It cannot edit a test to obtain GREEN. Tests consume the delivered interface through type-only imports or type operators; the Worker cannot widen the interface solely to make a negative fixture statically valid.

## Canonical Runner

`tools/harness/validation/run` remains an offline fail-fast shell entrypoint, preserves command-local `PATH`, and always unsets `XANTHIL_REAL_PI_ACCEPTANCE`. Its order is:

1. validate frozen Node `26.0.0`, npm `11.12.1`, DuckDB `1.5.2`, and Python `>=3.9`;
2. validate exact declared and installed Pi, TypeBox, TypeScript, and Node-types versions;
3. run native Node syntax checks over retained repository `.mjs` and migrated Xanthil `.ts`, excluding `node_modules`;
4. run `npm run typecheck`;
5. run native `node --test` Unit `.test.ts` files;
6. run Contract `.test.ts` files;
7. run Integration `.test.ts` files;
8. run E2E `.test.ts` files with the real-model gate absent; and
9. run the unchanged project-board `.mjs` regression.

`node --test tools/harness/validation/run.test.mjs` remains a separate focused command. The self-test is a named current executable consumer that justifies its conditional path; it proves order, early stop, offline gate removal, native stream behavior, and no persistent result.

## Activation, Compatibility, and Rollback

Activation is the single closed-graph cutover after all gates. There is no mixed compatibility period. The accepted run schemas, Port contracts, data, and user-owned Artifacts require no migration.

Rollback restores the code/module paths, manifest/lock/config/runner files from `a0ab053`. Removing `tsconfig.json` is part of rollback. Rollback never edits `.xanthil/runs`, the CSV, or other user data.

## Failure Semantics

Build/typecheck/syntax/test failures stop activation and create no product run or output. Runtime failure semantics remain those in the accepted current spec. A type-only issue is not grounds to change an error, deadline, cancellation winner, validation rule, Artifact sequence, or business value.
