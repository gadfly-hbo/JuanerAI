# Exploration

## Authorities and Baseline

- Change: `CHG-runtime-provenance-neutralization`
- Capability: `local-analysis`
- Branch: `work/macbook/runtime-provenance-neutralization`
- Clean implementation baseline: `1ba80d419e79f08f0002d17840c7cad92edc103c`
- Classification: boundary change, R2 evidence
- Spec route: user-authorized `gpt-5.6-sol` / high for this bounded run
- Concurrent state excluded from this role: Controller-owned `.juanerai/project-control/**`

The exploration read the current constitution, terminology, Runtime ADR, current `local-analysis` specification, architecture and security/data authorities, complexity and Xanthil reuse baselines, testing/Done and test-asset-retirement policies, the R2 handoff, all affected production seams, and the current TypeScript tests/fixtures. Archived first-slice material was used only to understand repository artifact conventions; current `.ts` source, current tests, and the current capability spec are authoritative.

## Current Executable Mapping

| Concern | Current producer/validator/consumer | Current fact and required delta |
|---|---|---|
| Run type and validation | `packages/product-core/local-analysis.ts` | `RunManifest.runtime` is only `PlainRecord`; `validateRunManifest` accepts only schema `1.0` and requires Pi-named keys. It must make schema `2.0` the current manifest and add a bounded exact legacy-terminal read validator. |
| Agent Runtime Port | `packages/ports/local-analysis.ts` | `preflightModel` returns only `ModelIdentity`; method set is exactly `preflightModel`, `openSession`. Its response must become one closed neutral readiness value without adding a method. |
| semantic writer/public Application result | `packages/application/local-analysis.ts` | Application hard-codes schema `1.0` and `{xanthil_version,pi_adapter_version,pi_version}`; it returns the manifest on every terminal path. It must compose current provenance from owned product constants, Profile input, and Adapter-observed readiness, write only `2.0`, and preserve it through every terminal copy. |
| Pi readiness and execution observation | `adapters/agent-pi/local-analysis.ts` | The Adapter already observes requested/available model at preflight and `session.model` after execution, but does not observe the loaded SDK `VERSION` and returns only the requested model. It must return closed readiness and observe SDK version from the loaded namespace. |
| durable reader/writer | `adapters/storage-local/local-analysis.ts` | One internal `manifest()` validator serves mutations and terminal read, so current code cannot express current-only mutation plus bounded legacy read. It must split those admission paths without migration, repair, list, or directory inspection. |
| Profile composition | `profiles/personal/local-analysis.ts` | External config is exactly `workspaceRoot`, `runRoot`, `provider`, `modelId`; Profile selects Pi and supplies model. It must additionally pass an internal constant `{id:"personal"}` to Application without exposing a new option. |
| CLI validation/public return | `apps/cli/xanthil.ts` | CLI revalidates Application terminal manifests through Product Core and returns the successful/current run. It should need no behavior change if the current validator becomes `2.0`; edits are conditional only on a demonstrated type or public-seam need. |
| shared doubles/fixtures | `tests/fixtures/xanthil-local-analysis/port-contracts.ts`, `cli-profile-harness.ts` | They freeze schema `1.0`, Pi-named runtime keys, the preflight model-only response, Artifact mutation admission, terminal read, and CLI results. They require bounded current/legacy fixtures and readiness observations. |
| SDK observation fixtures | `pi-sdk-failure-sdk.ts`, `pi-sdk-failure-child.ts`, `pi-sdk-failure-hook.ts` | The local module-hook path already tests production readiness without provider calls. It can expose and mutate `VERSION`; no new provider seam is needed. |
| executable contracts | Unit, Contract, Integration, E2E suites | `TEST-XCLI-004/006/008/009/010/011/013/017/018/019` are the existing identities that own the affected assertions. No new business TEST identity is required. |
| traceability | `coverage-map.ts` | Current AC identities already map to the affected TEST identities. Wording and cases change; no new AC or TEST identity is needed. |

## Configured Versus Observed Authority

| Value | Authority before a run | Evidence source | Persisted owner |
|---|---|---|---|
| product `{id:"xanthil",version:"1.0.0"}` | Application | Application-owned constants | Application |
| profile `{id:"personal"}` | Personal Profile | composition constant, not external config | Application transports Profile input |
| requested model | Personal Profile/Application dependency | existing `provider`/`modelId` config after closed validation | not persisted merely because requested |
| runtime `{id:"pi",version:"0.84.2"}` | Pi Adapter | Adapter constant ID plus loaded SDK `VERSION` export | Application persists preflight observation |
| adapter `{id:"agent-pi",version:"1.0.0"}` | Pi Adapter | Adapter-owned constants | Application persists preflight declaration |
| preflight-observed model | Pi Adapter | local `ModelRuntime.getModel` result | Application persists after equality with requested model |
| execution-observed model | Pi Adapter | actual `session.model` after SDK work settles | Application compares with the persisted preflight observation; it is not a second persisted value |

No value is sourced from a package manifest, environment variable, ambient model default, user run directory, or Application branch on a Runtime vendor name.

## Closed Decisions

1. New `run.json` writes use schema `2.0` and exactly the neutral top-level provenance nodes frozen in the delta spec. Pi is a value only.
2. `analysis-contract.json` and `evidence.json` retain their independent exact schema `1.0` contracts and shapes.
3. The existing `preflightModel` method returns closed deeply frozen `{runtime,adapter,model}` readiness. The Port gains no method and no registry/discovery/fallback behavior.
4. Product Core distinguishes current `2.0` validation from exact readable terminal validation. The latter accepts current terminal `2.0` and exact legacy terminal `1.0` only.
5. Every Artifact mutation admits only a current `2.0` run. Legacy `1.0` is read-only when terminal; legacy `in_progress` and unknown versions are rejected and untouched.
6. Legacy reads return the exact parsed legacy object, including legacy Pi-named keys, and preserve the complete stored tree and `run.json` bytes. There is no normalization, backfill, rewrite, or migration.
7. Rollback disables the new activation and preserves every artifact. The previous implementation is not promised to read `2.0`.

## Baseline Wording Delta

The Change modifies only:

- `REQ-XCLI-001` / `AC-XCLI-001-01..02`: closed Runtime readiness now includes observed provenance;
- `REQ-XCLI-007` / `AC-XCLI-007-01`, `03`, `04`: neutral readiness response, SDK `VERSION` observation, and requested/preflight/execution model equality;
- `REQ-XCLI-009` / `AC-XCLI-009-01`, `03`: only the Run Manifest advances to `2.0`, and semantic provenance ownership is explicit;
- `AC-XCLI-012-02`: runtime/model provenance resolves through the same-run `run.json`, not by duplicating it into `evidence.json` or Markdown;
- `REQ-XCLI-015` / `AC-XCLI-015-01`: complete product/runtime/adapter/profile/model provenance uses neutral nodes and owned observations;
- `REQ-XCLI-016` / `AC-XCLI-016-02..03`: exact bounded `1.0`/`2.0` terminal read compatibility, current-only mutation, no migration, and non-destructive rollback; and
- `AC-XTS-003-02`: the historical migration behavior remains, while this approved provenance Change may add independently scheduled assertion groups and freezes its new counts at Test Design.

Every other `REQ-XCLI-001..016` requirement/criterion, the complete `REQ-XTS-*` contract except the count/evidence wording above, the fixture/oracle, Local Analysis Execution behavior, failures, security, timing, cancellation, atomicity, assets, model choice, and user journey remain unchanged.

## Open Decisions

None. The approved schema, ownership, compatibility, activation, and rollback decisions are sufficient for Spec Gate review.
