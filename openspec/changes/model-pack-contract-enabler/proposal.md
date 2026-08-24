# Proposal: Model Pack Contract Enabler

## Decision

- Change: `CHG-model-pack-contract-enabler`
- Planning node: E
- Class: boundary change; R2 / complex root-cause; greenfield fast path is forbidden.
- Accountable user: Data Analyst.
- Product objective: enable a future Xanthil Consumer to use one released 28-day category-demand Model Pack through JuanerAI business contracts, with stable identity, exact provenance, local-only permissions, and fail-closed behavior.
- Delivery objective: create the minimum executable `MP-C01..MP-C05` contract authority and deterministic shared suites without building or activating the Provider, SDK, Consumer, Profile, MLflow, training, or product behavior.
- Learning objective: show that one Provider and one Consumer can independently target the same closed package and Runtime contracts without provider technology, filesystem paths, network access, or Profile activation entering those contracts.

## R2 Contract and Test-oracle Clarification

Earlier R2 returns closed the public TypeScript calls, error delivery,
predictor construction/timer boundaries, and invalid singleton-evidence
comparators. Combined execution after the prior TDD_READY exposed one narrower
permission-oracle conflict: `ModelPackPermissionsV1` is a single exact literal
grant, manifest serialization/admission rejects every widened field as
`MODEL_PACK_PERMISSION_DENIED`, and Runtime factory construction accepts only
the same exact grant. An admitted manifest permission value unequal to a valid
immutable factory binding is therefore not constructible through the public
contract. This deletion-only root-cause revision keeps the defensive preflight
comparison but removes any obligation to bypass manifest admission and execute
seven duplicate preflight mutations. It adds no field, parser, second
serializer, bypass, authority, default, lookup, callback, registry, or test
seam. The product, production paths, M0 boundaries, public v1 surface, nine
contract functions, five Requirements, 30 Acceptance Criteria, nine Test
identities, 12 Tasks, and 19 errors remain unchanged. The prior TDD_READY and Worker dispatch
are reopened; partial production remains frozen without GREEN. Controller
re-review and a new Spec Gate are required before Test correction or any Worker
continuation.

After that bounded Test correction, the inactive-loader and closed-graph
conflicts reopened the Gate without changing product semantics. The resulting
Test return completed the exact eight-entry `TEST-XCLI-021` append and is now
byte-frozen, but its strict inactive oracle exposed the next native Node v26.0.0
layer: `getSourceSync` calls the captured original `readFileSync`, which still
calls the patched exported `openSync`. With all `openSync` calls forbidden, the
two first imports cannot settle; the inactive target reports 14 pass and 1
loader failure. The narrow Test/toolchain exclusion must therefore cover the
paired `readFileSync` plus nested `openSync` chain for exactly the two approved
E source files, only while awaiting their corresponding first dynamic imports.
The observed target set for each method must equal exactly those two files.
Non-nested `openSync`, late same-path calls, third targets, and every other
filesystem/network/process/predictor/registration/Profile/CLI effect remain
forbidden. This correction adds no production loader, seam, callback, registry,
bypass, glob, graph relaxation, or product behavior. The same five
Requirements, 30 Acceptance Criteria, nine Test identities, 12 Tasks, 19
errors, nine contract functions, one Runtime factory, and all public signatures
remain unchanged.

## Scope and Observable Outcome

E delivers:

- a canonical closed `ModelPackManifestV1`, first-scenario input/output, MP9 release-input, Artifact observation, immutable revocation policy, pure Controller-authoritative `ModelPackReleaseStatusV1`, compatibility, permission, lifecycle, exact nine-function TypeScript calling surface, and one sanitized stable error carrier;
- a scenario-specific `AnalyticalModelRuntime` constructed from one immutable Runtime/Adapter/dependency/permission binding and one exact local predictor dependency, which preflights one exact Pack/release status, binds one confirmed input snapshot to one one-shot Run, executes one local 28-day prediction, and closes cancellation/deadline/late-settlement, output, determinism, failure, and provenance semantics;
- separate package/SDK and Runtime adapter-independent contract drivers, deterministic doubles, and an inert integration proof;
- a human contract index and exact conditional inclusion in the root TypeScript/canonical validation graphs; and
- no active Profile, CLI entry, product behavior, Provider, SDK, Consumer, dependency, network, data, model, or MLflow operation.

The deterministic E fixtures prove only the contract and driver health. They are not evidence of installability, real SDK inference, MLflow release, Xanthil consumption, or product acceptance.

## Non-goals

- MP1/MP2 execution, data collection, training, evaluation, MLflow configuration or access, MP3-MP9 state persistence, or Controller release decisions.
- A real `ModelPackBuilder`, SDK, Provider/private implementation, independent Consumer, Xanthil Consumer, or active Profile.
- Real `history.csv`, isolated `acceptance-actuals.csv`, Artifact filesystem observation, release-status lookup, network, external repository, provider/model call, or actual inference.
- Runtime or revocation registry, status service/list/cache/watcher, retry, fallback, hot switching, auto-routing, multi-model selection, universal Runtime, Agent Runtime reuse, remote Serving, enterprise identity/security machinery, Decision, or Action.
- Package manager/workspace changes, dependency installation, broad build-graph refactors, migration, compatibility aliases, or background/persistent machinery.

## Reuse, Delta, and Compatibility

- Reuse unchanged: JuanerAI product language, business Port/Adapter direction, local-only data boundary, supply-chain rule, ADR 0003, native TypeScript/node:test toolchain, fail-closed admission style, and adapter-independent driver pattern.
- New delta: the exact v1 Model Pack and scenario Runtime contracts. No existing product contract or current Port is widened.
- Compatibility: only exact contract/schema version `1.0` and exact package identity `juanerai.sales-demand-forecast` are admitted. Package release versions use strict stable `MAJOR.MINOR.PATCH`. Unknown versions, aliases, `latest`, coercion, defaulting, migration, dual-read, and best-effort compatibility are forbidden.
- Serialization: manifest and MP9 release input use canonical UTF-8 JSON produced and admitted by the shared contract serializer; unknown, missing, null, wrong-type, malformed, non-canonical, or duplicate-member input fails closed.

## Boundary and Paths

| Kind | Paths / authority |
|---|---|
| allowed | `packages/contracts/model-pack.ts`; `packages/ports/analytical-model-runtime.ts`; `docs/contracts/model-pack.md`; dedicated `tests/{contract,integration,fixtures}/model-pack-contract-enabler/**`; this Change's OpenSpec path |
| conditional | exact append-only E entries in `tsconfig.json`; exact E commands in `tools/harness/validation/run`; the completed `tests/integration/xanthil-local-analysis/local-analysis.integration.test.ts` correction solely contains the same eight E entries in `approvedTsconfig.files` and is now frozen; no additional package namespace is presently approved |
| forbidden | manifests/lockfiles/dependencies; SDK/Provider/Builder/private implementation; Product Core/Application/CLI/Consumer; Profiles/activation; real data/model/network/MLflow/filesystem/external repositories; broad build/workspace changes; project-control by role agents |

The Controller owns every shared contract, Port, driver, suite, Profile decision, and conditional root-graph edit. P and C consume the frozen drivers unchanged. Drift blocks the dependent branch and requires a Contract Change Request.

## Data and Security

The executable Runtime input is only the confirmed local snapshot: `as_of_date`, one declared currency, and at least 56 consecutive UTC days of the five closed daily category fields. The Runtime output is exactly the next 28 UTC days for every admitted category with the two predictions and two 80% intervals. Runtime permissions are local-only, no network, no external data, no MLflow/training workspace, no source write, and no online learning.

The 196-day training history, isolated 28-day actuals, rolling folds, seasonal-naive baseline, WAPE thresholds, key-category gate, and interval acceptance gate are release/acceptance evidence. Their metadata may be carried by the package; the underlying data and metrics are not Runtime SDK inputs. An exact local MLflow `file:` Artifact URI may cross MP9 only as a precise locator paired with a supplied observation that carries the closed Controller-authorization/location-verification assertion. E validates that assertion's closed shape and kind, compares only the observation's URI/SHA/size/model-Signature fields that have release/manifest counterparts, and never reads or resolves a path. P privately proves real existence, approved-root membership, and exclusion from training/cache/source locations. Model output remains evidence, not a Decision or Action.

## Dependencies and Permissions

- Dependencies: current Node, TypeScript, Node types, `node:test`, and standard-library hashing only.
- Package/lock changes: forbidden.
- Data: deterministic synthetic E fixtures only.
- Filesystem: repository source/tests and temporary test workspaces only; the
  inactive Test oracle may exclude and separately observe only Node's exact
  paired source-loader `readFileSync` plus nested `openSync` chains for the two
  approved E modules during their corresponding first dynamic imports.
  No product/business Artifact or user-data read, URI dereference, store-root
  verification, release-status persistence, or other filesystem read/stat/open
  is permitted.
- Network/external repositories/MLflow/provider/model: forbidden.
- Real-model mode: none. Canonical validation always removes the existing real-model gate.

## Activation, Rollback, and Retirement

E is inert on merge: importing, validating, or building its contract namespace does not register a capability, change a Profile, expose a CLI entry, choose a Runtime, or run a model. Package installation never grants permission or activates product behavior.

Only A may activate after E/H/P/C are integrated and verified. A must bind one exact package identity/version/checksum, one exact Runtime identity/version, one exact Adapter identity/version, and one exact Profile identity/version; it may not use aliases, registries, fallback, hot switching, or auto-routing. Rollback deactivates that exact binding and returns to the prior inactive or explicitly approved binding while preserving all user-owned inputs, predictions, evidence, and provenance. The future Application/A composition must obtain and supply the current Controller-authoritative status for the preflight of each Run; `revoked` blocks readiness, successful result provenance preserves the exact `released` evidence that admitted the Run, and E provides no freshness lookup/cache/registry or durable machinery. Retirement removes future availability only through a separate approved Change.

## Integration Constraint

Strict product PR order is E -> H -> P -> C -> A. E must merge before P or C contract consumption. P may not modify shared contracts, Xanthil, Profiles, or project-control. C may not treat a double as final SDK evidence or activate a Profile. A may not repair P/C or change contracts, thresholds, data, or rollback semantics during activation.

## Evidence Level and Gates

- Spec Gate: the prior permission-oracle Gate and its bounded Test correction are
  historical. The inactive-loader/closed-graph Gate and completed eight-entry
  Local Analysis correction are also historical. The Node v26 nested
  `openSync` loader-chain conflict reopens the current package for mandatory
  complete-diff ponytail review and Controller Spec Gate. No historical PASS
  authorizes another Test correction or Worker continuation.
- Test/RED: after a new Spec Gate, formal Test may change only
  `contracts-inactive.integration.test.ts` to exclude/observe the two exact
  paired source-loader chains. The Local Analysis integration correction and
  all other Test assets are byte-frozen. Test records the inactive asset's exact
  before/after SHA-256 plus current hashes for all six frozen Test assets,
  proves helper/oracle health, and reruns the corrected matrix against frozen
  partial production.
  Causal RED must be attributable only to missing approved product behavior;
  loader, graph, environment, toolchain, fixture, helper, or unrelated baseline
  failure is invalid evidence. No RED/GREEN result is preclaimed here.
- GREEN: focused package, Runtime, and inert-integration suites; typecheck; affected Local Analysis contract/integration/E2E regression; exact scope checks; canonical offline validation.
- Test Asset Retirement: complete lifecycle ledger, Controller `ponytail-review`, no temporary/orphan/duplicate test asset, then PASS.
- Verification: fresh read-only Validator on frozen current Head.

Current normative counts remain the fixed counts above. Historical Test hashes
and executable results are evidence only in `verification.md`; the Test Agent
must refreeze current hashes and causal results after the new Spec Gate.
