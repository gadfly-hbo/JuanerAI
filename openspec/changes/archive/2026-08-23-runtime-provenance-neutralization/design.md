# Design

## Design Summary

Keep the existing architecture and method sets. Change the current Run Manifest to schema `2.0`; make `preflightModel` return one neutral closed readiness value; let Application compose that observation with its product constants and the Profile identity; and split Artifact admission into current-`2.0` mutation versus exact terminal-`1.0|2.0` read.

No registry, migration, repair, second Runtime, new Port method, dependency, or CLI option exists.

## Architecture and Ownership

`CLI -> Application -> Product Core`

`Application -> Ports <- Adapters`

`Personal Profile -> Application + Pi/Analysis/Storage Adapters`

| Layer | Owns | Must not do |
|---|---|---|
| Product Core | closed current `2.0` Run validation; exact legacy terminal `1.0` read validation; neutral ID/version/model structural rules | import Pi/SDK/filesystem/Profile types; choose an Adapter; migrate an artifact |
| Application | Xanthil product ID/version constants; preflight sequencing; requested-versus-observed checks; sole semantic Run writer; terminal/public propagation | inspect SDK/package/environment; branch on `pi` or `agent-pi`; invent runtime/adapter/profile observations |
| Agent Runtime Port | business-neutral readiness and existing session contract | add discovery/registry/fallback methods or Pi types |
| Pi Adapter | runtime ID, Adapter ID/version, loaded SDK `VERSION`, preflight model, execution model | expose SDK namespace/session types; write Run artifacts; report requested values as observations without checking |
| Personal Profile | constant profile ID and Pi selection; unchanged external config | expose profile identity as a user option; persist provenance |
| Storage Adapter | current-only mutation; exact dual terminal read; byte-preserving transport/persistence | normalize, backfill, repair, list, scan, or invent provenance |
| CLI | current Application result validation and transport | read legacy directories or manufacture provenance |

## Closed Current Run Manifest `2.0`

The current top-level common key set is exactly:

```text
schema_version, run_id, analysis_kind, status, started_at,
product, runtime, adapter, profile, model, contract, sources, artifacts
```

Terminal optional/discriminated keys remain exactly `ended_at`, `evidence`, and `terminal_detail` under the unchanged status rules.

For the approved Personal composition every new manifest contains:

```json
{
  "schema_version": "2.0",
  "product": { "id": "xanthil", "version": "1.0.0" },
  "runtime": { "id": "pi", "version": "0.84.2" },
  "adapter": { "id": "agent-pi", "version": "1.0.0" },
  "profile": { "id": "personal" },
  "model": { "provider": "minimax-cn", "model_id": "MiniMax-M3" }
}
```

Each nested object is closed. `product`, `runtime`, and `adapter` require only non-empty stable ID plus valid semantic version; `profile` requires only a non-empty stable ID; `model` requires only non-empty `provider` and `model_id`. Product Core performs structural current validation without a Runtime registry. Application-owned product constants, the Personal Profile constant, and Pi Adapter observations make the active composition's values exact. Future values require a separately approved Profile/Runtime Change even though the neutral structural vocabulary is reusable.

The current `2.0` model has no `thinking_level` or other optional field. There is no `profile.version`. Pi-specific legacy names are invalid anywhere in a `2.0` provenance node, and top-level unknown/missing/null fields remain invalid.

`analysis-contract.json` and `evidence.json` keep schema `1.0` and their exact current shapes. Their version values do not follow the Run Manifest version. Summary and Evidence Markdown content remains unchanged.

## Exact Legacy Read Contract

Product Core has two explicit validation purposes inside its existing module:

1. current Run admission accepts only exact schema `2.0` in any valid lifecycle state; and
2. readable terminal admission accepts either an exact current terminal `2.0` manifest or the exact terminal form of the current baseline schema `1.0` manifest.

The legacy `1.0` form retains its current Pi-named runtime object and current model rule, including the currently accepted optional `thinking_level`. It is accepted only when `status` is `succeeded`, `failed`, or `cancelled` and all existing terminal, source, artifact, evidence-descriptor, timestamp, and checksum-shape rules pass. Legacy `in_progress` is not a readable terminal and is never resumed or repaired. Unknown versions fail closed.

The Product Core module may expose one additional validator method through the existing domain factory to express readable-terminal admission. This is not a Port method or new module. Current Application and CLI use the current validator; only Storage terminal read uses the readable-terminal validator.

`RunManifest` denotes current `2.0` writes/results. A bounded legacy/readable type may be added in Product Core and used only by `readTerminalRun`'s result. Mutating Artifact inputs remain current `RunManifest`.

For a successful legacy read:

- the returned `manifest` is structurally equal to the parsed legacy JSON, retaining every legacy key/value and adding no current field;
- all indexed asset bytes/checksums are verified under the unchanged Artifact contract;
- the stored tree and exact `run.json` bytes before and after read are identical; and
- no temporary, migrated, normalized, backfilled, or repair artifact is created.

## Neutral Runtime Readiness

The existing Port method remains:

```ts
preflightModel(input: { model: ModelIdentity }): Promise<RuntimeReadiness>
```

The response is a deeply frozen closed business value with exact keys:

```json
{
  "runtime": { "id": "pi", "version": "0.84.2" },
  "adapter": { "id": "agent-pi", "version": "1.0.0" },
  "model": { "provider": "minimax-cn", "model_id": "MiniMax-M3" }
}
```

The type is neutral: its IDs/versions are strings governed by the closed structural contract. The concrete values above are the Pi implementation's result.

The Pi Adapter:

- self-declares constants `runtime.id = "pi"`, `adapter.id = "agent-pi"`, and `adapter.version = "1.0.0"`;
- reads `runtime.version` from the `VERSION` export of the same successfully loaded SDK namespace used for readiness/session creation;
- accepts that version only when it is exact non-empty semantic version `0.84.2`; missing, malformed, or mismatched `VERSION` maps through the existing sanitized `RUNTIME_UNAVAILABLE` preflight failure;
- observes the selected preflight model through `ModelRuntime.getModel`, compares it with the request, and returns the observed identity; and
- continues to observe actual execution model from `session.model` after SDK work settles.

The existing deterministic module-hook fixture is the executable observation seam for SDK `VERSION`; no package-manifest read, network call, credential access, or source-string assertion substitutes for it.

## Application Composition and Equality

Application dependencies gain one internal closed `profile: {id:string}` value. The Personal Profile passes frozen `{id:"personal"}` while its public config remains exactly `workspaceRoot`, `runRoot`, `provider`, `modelId`.

Application flow is:

1. validate the existing requested model dependency and Profile identity;
2. call `preflightModel` in the unchanged preflight order;
3. validate the deeply frozen closed readiness response and require readiness model equality with the requested model;
4. open the existing one in-memory session with that requested/observed-equal model;
5. after confirmation, construct schema `2.0` from Application product constants, readiness runtime/adapter/model, and Profile identity;
6. pass only current `2.0` manifests to Artifact mutations;
7. after execution, require `actual_model` equality with the preflight-observed model; and
8. preserve the same provenance values through success, failure, cancellation, and the CLI/Application public return.

Application never compares a runtime or adapter ID to a vendor literal and does not select or fall back by those values. Product/adapter versions are constants in their owning Application/Adapter modules, not package metadata or configuration.

## Artifact Admission

Storage separates two internal read purposes without adding a public method:

- `beginRun`, `commitConfirmedContract`, `appendAsset`, `replaceManifest`, and `commitSuccess` admit only an exact current `2.0` state. This includes operations whose command carries only `run_id`: the existing stored manifest must validate as current `2.0` before mutation.
- `readTerminalRun` admits only an exact terminal `1.0` or terminal `2.0` state.

Every rejection is sanitized through the existing Artifact error behavior; the stable public failure vocabulary is unchanged. Rejection creates no write and preserves bytes. Terminal immutability, atomic publication, success-last linearization, signal admission, asset verification, and collision behavior remain unchanged.

No method scans a run root. All operations continue to require one explicit UUIDv7 `run_id`.

## Evidence Projection

`evidence.json` continues to resolve Findings to sources and numbered analytical assets. `evidence.md` continues to project the same Finding/source/asset/checksum view. Product/runtime/adapter/profile/model provenance resolves from the same-run `run.json`, linked by the same `run_id` and successful Run evidence descriptor; it is not duplicated into `evidence.json` or Markdown.

## Failure, Security, and Data Boundaries

- Existing failure codes/stages and CLI mappings remain unchanged.
- Version mismatch in Product Core remains `CONTRACT_VERSION_UNSUPPORTED`; Storage continues to sanitize invalid Artifact admission under its current boundary behavior.
- SDK `VERSION` absence/mismatch is `RUNTIME_UNAVAILABLE` before Session/model/provider work.
- Requested/preflight model mismatch is `MODEL_UNAVAILABLE`; execution/preflight mismatch is `MODEL_EXECUTION_FAILED` under the existing runtime stage.
- No credentials, SDK namespace, package paths, environment values, raw model text, or user artifacts enter provenance.
- No real provider/model call is authorized for RED, GREEN, regression, or validation.

## Activation, Compatibility, and Rollback

Activation is a single Personal Profile cutover to new-write `2.0` plus bounded terminal dual-read. There is no dual writer and no compatibility mode for mutation.

Rollback restores prior activation and preserves all artifacts. It does not promise the old reader can understand `2.0`, retain a new reader, or perform migration. A later migration/retirement policy would require a separate Change.

## Complexity Controls

The complete OpenSpec diff requires `ponytail-review` before Spec Gate because the Spec route used high reasoning and the Change alters a durable schema/shared boundary. Test Design and post-GREEN evidence require the Test Asset Retirement lifecycle ledger and Gate. Any need for registry, generic provenance service, migration, repair, new Port method, second Runtime, dependency, user option, or architecture document is a stop line.
