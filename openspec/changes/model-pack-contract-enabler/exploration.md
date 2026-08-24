# Exploration: Model Pack Contract Enabler

## Intake

- Change: `CHG-model-pack-contract-enabler`
- Planning node: E
- Baseline and explored HEAD: `2b2889029d6a0947027096acc0c541a7751fdd4f`
- Branch: `work/macbook/model-pack-contract-enabler`
- Owner: MacBook Integration Controller
- Class and route: boundary change; R2 / complex root-cause; Spec route Sol high
- Lifecycle: Explore complete; the prior TDD_READY and Worker dispatch remain
  reopened. The eight-entry `TEST-XCLI-021` correction is now complete and
  byte-frozen. The corrected inactive oracle still cannot import either
  approved E module under command-local Node v26.0.0: native `getSourceSync`
  calls the captured original `readFileSync`, whose implementation in turn
  calls the patched exported `openSync`. This third bounded R2 Spec correction
  is ready for mandatory ponytail and Controller re-review; partial production,
  tests, docs/contracts, and root graphs remain frozen and are not GREEN.

## Frozen Intent

- Product objective: make a released JuanerAI Model Pack a stable, provenance-bearing business package that a future Provider and Xanthil Consumer can consume without inheriting MLflow, a training workspace, an external repository, or provider-specific structures.
- Delivery objective: turn planning contracts `MP-C01..MP-C05` into the minimum closed executable shared package, MP9-release-input, scenario Runtime, contract-suite, and inactive-activation contracts.
- Learning objective: prove with deterministic local fixtures and doubles that those shared contracts are closed and independently implementable before authorizing a real Provider, SDK, Consumer, Profile, data, MLflow, training, or inference.
- First scenario: a Data Analyst supplies one confirmed local snapshot as of `as_of_date`, containing at least 56 consecutive UTC days of daily `product_category` aggregates in one declared currency, and receives the next 28 UTC days of per-category `predicted_order_count`, `predicted_net_order_amount`, and 80% intervals.

The result remains model evidence. It is not a Decision, Action Recommendation, Action, Outcome, causal claim, or authorization to change a business system.

## Authorities Examined

- `AGENTS.md`, `CONTEXT.md`, `Orchestration.md`, and `.codex/agents/juaner_spec.toml`.
- The required `.ai-coding` workflow, state, architecture, security, testing, traceability, and completion policies.
- `docs/governance/agent-model-routing.md`, `change-complexity-control.md`, and `test-asset-retirement.md`.
- Package, Port/Adapter, data-authority, and security architecture documents plus ADR 0003.
- The frozen two-phase Model Pack plan, first-scenario contract, MP1-MP9 lifecycle attachment, device/path ownership matrix, shared-contract hotspots, and E -> H -> P -> C -> A integration protocol.
- Existing empty `packages/contracts/`, existing scenario Ports, current adapter-independent driver/double patterns, `docs/contracts/README.md`, root TypeScript graph, package manifest, and canonical offline runner.
- Archived OpenSpec packages for repository format only.

No ModelEvol, pi-xanthil, external repository, network source, real data, MLflow process, provider, or model was opened or invoked.

## Current Baseline Facts

- `packages/contracts/` has no implementation and there is no `AnalyticalModelRuntime`.
- Node's native TypeScript execution, `node:test`, TypeScript, Node types, and the current dependency set are sufficient. No package or lockfile change is needed.
- `tsconfig.json` and `tools/harness/validation/run` use explicit closed lists. Exact E files and test commands therefore require narrow Controller-owned additions after TDD_READY; broad include/workspace changes are unnecessary.
- `TEST-XCLI-021` independently mirrors the root `tsconfig.files` closed list.
  E's already approved append-only graph delta has now received the matching
  Test-owned append of the same eight exact entries, with the Test identity and
  every other dependency/configuration assertion preserved; that asset is
  byte-frozen for the next return.
- `TEST-MPC-009` installs its filesystem observer before the first dynamic
  imports of the two approved E source modules. Node's native TypeScript ESM
  loader necessarily follows `getSourceSync` -> `readFileSync` -> nested
  `openSync` to load those exact repository source files. The captured original
  `readFileSync` still invokes the patched exported `openSync` on Node v26.0.0.
  Those paired calls are toolchain mechanics, not product or business
  Artifact/user-data filesystem behavior.
- Existing contract drivers demonstrate only the reusable organizational pattern: one unchanged driver runs against a deterministic double and later a real implementation. They do not define Model Pack semantics.
- Existing Profiles and CLI contain no Model Pack activation. E can remain inert by adding no Profile, composition-root, Product Core, Application, CLI, Provider, SDK, or Consumer implementation.

## Closed Delta

E creates only these future implementation seams after the required Gates:

1. `packages/contracts/model-pack.ts`: closed v1 package, scenario I/O, MP9 release-input, canonical serialization, validators, artifact-observation comparison, error vocabulary, and inert activation-reference types needed by `MP-C01`, `MP-C02`, and `MP-C05`.
2. `packages/ports/analytical-model-runtime.ts`: the scenario-specific `AnalyticalModelRuntime` and one-shot bound Run contract required by `MP-C03`.
3. `docs/contracts/model-pack.md`: human-readable ownership, compatibility, permissions, activation, rollback, retirement, and cross-device contract.
4. Dedicated `tests/contract/model-pack-contract-enabler/**`, `tests/integration/model-pack-contract-enabler/**`, and `tests/fixtures/model-pack-contract-enabler/**` shared authority for `MP-C04`.
5. Exact append-only TypeScript and canonical-runner inclusion, only if Controller releases the conditional paths after causal RED.

The closed package identity is `juanerai.sales-demand-forecast`. Contract/schema versions are `1.0`; actual package semantic version, artifact identity, currency, model/runtime/dependency versions, license, evidence checksums, and release decision values remain required MP9-supplied values rather than defaults.

## Data, Dependency, Network, and Model Boundary

- E uses synthetic deterministic records only. It does not request or read `history.csv`, `acceptance-actuals.csv`, a real Artifact, or MLflow state.
- The 196-day training history, isolated 28-day actuals, three rolling-origin folds, seasonal-naive baseline, WAPE thresholds, key-category gate, and interval-coverage gate remain MP1-MP9 and A acceptance evidence. They may be represented as release/evaluation metadata but are never Runtime SDK input.
- `acceptance-actuals.csv` remains Controller-only and unavailable until A's separate authorization.
- Runtime data is local-only. Network, external data, MLflow access, training-workspace access, source mutation, online learning, fallback, automatic routing, and undeclared permissions are forbidden.
- E installs nothing and adds no dependency. It starts no process and creates no persistence schema.

## Change Boundary

### Allowed after the next Gates

- `packages/contracts/model-pack.ts`
- `packages/ports/analytical-model-runtime.ts`
- `docs/contracts/model-pack.md`
- `tests/contract/model-pack-contract-enabler/**`
- `tests/integration/model-pack-contract-enabler/**`
- `tests/fixtures/model-pack-contract-enabler/**`
- `openspec/changes/model-pack-contract-enabler/**`

### Conditional; exact Controller release required

- `tsconfig.json`: append exactly the approved E production and test files; preserve every existing compiler option and file entry.
- `tools/harness/validation/run`: append exactly the E contract and integration commands; preserve the command-local toolchain, fail-fast behavior, and unconditional real-model-gate removal.
- `tests/integration/xanthil-local-analysis/local-analysis.integration.test.ts`:
  the completed append contains exactly the eight approved E entries in
  `approvedTsconfig.files` for `TEST-XCLI-021`; preserve the frozen Test identity,
  hash, and every other assertion. No further edit is released.
- A closed package namespace other than the named contract/Port paths only if Test evidence proves the executable contract cannot otherwise be expressed. No such namespace is presently required.

### Forbidden

- `package.json`, any lockfile, dependency installation, broad TypeScript includes, workspaces, or package-platform refactors.
- `packages/model-pack-sdk/**`, Provider training/MLflow/Builder implementation or placeholder, independent Consumer implementation, and any real Artifact or filesystem Adapter.
- Xanthil Product Core, Application, CLI, Desktop, Console, Consumer Adapter,
  or current Local Analysis behavior. The sole exception is the conditional
  Test-owned closed-list append above; no Xanthil behavior or other assertion
  may change.
- `profiles/**`, active composition, activation behavior, registry, fallback, hot switching, automatic routing, or a universal Runtime.
- Real data, model, provider, network, MLflow, training, inference, external repository, action, or product-side effect.
- `.juanerai/project-control/**` by Spec, Test, Worker, or Validator. Controller lifecycle writes remain separate governance activity.

Any need to widen these paths, change ownership, add a dependency/schema/persistence mechanism, or consult an external repository returns to Controller through a Contract Change Request.

## Integration and Ownership

- E is the sole contract authority and must merge first.
- H and P may start only from E-merged `origin/main`; H merges before P.
- P implements Provider/SDK/Builder/private tests on Mac mini and consumes E's package driver and contracts read-only. P cannot edit shared contracts/suites or Controller state.
- C starts from E/H, may develop against the frozen Runtime double, but final GREEN/Validator/merge waits for P's real MP9 SDK on E/H/P main. C consumes the Runtime driver read-only and keeps Profile inactive.
- A alone may bind and activate one exact Pack, Runtime, Adapter, and Profile after E/H/P/C merge and real-data/model authorization. Strict merge order is E -> H -> P -> C -> A.

## Explore Verdict

`SPEC_REVISION_READY`.

No load-bearing product fact requires external study or a new user decision. The remaining concrete values are release-instance inputs intentionally supplied by later MP9/P/A work. No validation claim is made by this exploration.

## Permission-oracle Root Cause

`ModelPackPermissionsV1` is one exact literal grant. Manifest serialization and
admission reject every missing or widened permission as
`MODEL_PACK_PERMISSION_DENIED`, while Runtime factory construction rejects a
malformed permission binding as `ANALYTICAL_MODEL_RUNTIME_INCOMPATIBLE`.
Therefore no admitted manifest with unequal permissions can be paired with a
valid immutable factory binding. Preflight retains its defensive equality
check, but E requires no bypass, second serializer, parser seam, registry,
default, or lookup to make that unreachable state test-constructible.

## Inactive-oracle and Closed-graph Root Cause

The inactive contract remains absolute at the product boundary: import,
serialization, validation, preflight, and `openRun` may not read/stat/open an
Artifact or user data, access the network, start a process, execute the
predictor, register a capability, or modify a Profile/CLI. The Test oracle may
delegate and separately observe only the paired native Node source-load chain
whose outer `readFileSync` and nested `openSync` resolve to the same target,
which is exactly
`packages/contracts/model-pack.ts` or
`packages/ports/analytical-model-runtime.ts` and occur while awaiting the
corresponding first dynamic import. The observed `readFileSync` target set and
nested `openSync` target set must each equal exactly those two files, and both
exclusions end when the imports settle. Any `openSync` not nested under an
allowed `readFileSync`, any late same-path call, any third target, and every
other filesystem read/stat/open remains a forbidden effect. This exclusion adds
no production seam, loader, callback, registry, bypass, or product permission.

The root TypeScript graph and `TEST-XCLI-021` now both contain exactly the two
production and six Test-owned E files. The Local Analysis correction is frozen
at 3,096 lines and SHA-256
`b5c43e3bf65faab5e75c60a481c8c22aa966690c56b22a465622ab2a18dc433f`;
it is not reopened by this loader-chain correction.
