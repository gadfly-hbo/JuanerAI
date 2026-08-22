# Local Analysis Runtime Provenance Neutralization Delta

This delta applies alongside `openspec/specs/local-analysis/spec.md`. It replaces only the Requirement/Acceptance Criterion wording explicitly marked below. Every omitted Requirement, Acceptance Criterion, stable failure, explicit non-requirement, and Native TypeScript delivery rule remains unchanged.

## Exact Current Run Provenance Contract

Every new Run Manifest has `schema_version: "2.0"` and these exact closed provenance values in the approved Personal composition:

```json
{
  "product": { "id": "xanthil", "version": "1.0.0" },
  "runtime": { "id": "pi", "version": "0.84.2" },
  "adapter": { "id": "agent-pi", "version": "1.0.0" },
  "profile": { "id": "personal" },
  "model": { "provider": "minimax-cn", "model_id": "MiniMax-M3" }
}
```

`product`, `runtime`, and `adapter` each contain exactly `id` and `version`; `profile` contains exactly `id`; `model` contains exactly `provider` and `model_id`. IDs/providers/model IDs are non-empty stable identifiers and versions are semantic versions. There is no `profile.version`, no model duplication under `runtime`, and no Pi-named key in schema `2.0`.

## Modified Requirements

### REQ-XCLI-001 — Eligible CLI Entry and Closed Preflight

The personal Profile SHALL expose one interactive `xanthil` Analyst Assistant entrypoint for the approved repository workspace and SHALL validate fixture identity, explicit model selection, closed Runtime readiness/provenance, run-root safety, and contract-version support before presenting a confirmable Analysis Contract.

- **AC-XCLI-001-01:** Given the approved workspace, exact fixture, writable safe run root, supported contracts, approved Node runtime, explicit `minimax-cn/MiniMax-M3`, and Pi Adapter readiness reporting runtime `pi/0.84.2`, Adapter `agent-pi/1.0.0`, and observed model `minimax-cn/MiniMax-M3`, starting `xanthil` reaches Discovery without creating `.xanthil/runs/<run_id>/`. Activation of the model default remains subject to the existing R4 real acceptance gate.
- **AC-XCLI-001-02:** Before Session opening, Discovery, Proposal, model call, or run creation, preflight validates the unchanged run-root/fixture/contract boundaries and one deeply frozen closed Runtime readiness result. Missing, malformed, extra, unavailable, version-mismatched, or requested-model-mismatched readiness reports the existing stable preflight reason, makes no model/provider call, creates no run, and performs no source or global-configuration write.

### REQ-XCLI-007 — Replaceable Agent Runtime Boundary and Readiness Provenance

Application SHALL access Pi through the existing business-oriented Agent Analysis Runtime Port whose contract covers explicit model selection, closed runtime/Adapter/model readiness, one in-memory Discovery/Execution session, approved tool invocation, streamed user-visible events, timeout, cancellation, and sanitized failure mapping without exposing Pi SDK, CLI, process, or session-persistence types.

- **AC-XCLI-007-01:** The project-local Pi SDK Adapter and an in-memory contract double pass the same Agent Analysis Runtime contract suite with exactly the existing methods `preflightModel` and `openSession`; the suite includes the closed readiness response plus every previously accepted Discovery, confirmation, Execution, forbidden-tool, event-ordering, timeout, cancellation, and failure-mapping behavior.
- **AC-XCLI-007-03:** `preflightModel` returns exactly deeply frozen `{runtime:{id,version},adapter:{id,version},model:{provider,model_id}}`; Application persists the preflight-observed model only after it equals the requested model, and after SDK operations settle it requires execution-observed `session.model` equality with that preflight observation. Any structural or equality mismatch fails closed with the existing sanitized product error and cannot produce success.
- **AC-XCLI-007-04:** The Pi Adapter uses only the project-local Pi SDK `0.84.2`, reads runtime version from that loaded SDK namespace's exact `VERSION` export, self-declares runtime ID `pi` and Adapter `agent-pi/1.0.0`, and retains every existing local-only refresh, explicit model, inert-resource, disabled-tool/extension, in-memory persistence, and no-retry rule. A missing, malformed, or non-`0.84.2` SDK `VERSION` fails as `RUNTIME_UNAVAILABLE` before Session/provider work.

`AC-XCLI-007-02`, `AC-XCLI-007-05`, and `AC-XCLI-007-06` remain unchanged.

### REQ-XCLI-009 — Closed Run Manifest `2.0` and Independent Artifact Contracts

Application SHALL be the single semantic writer of a closed Run Manifest schema `2.0` containing `run.json`, while `analysis-contract.json` and `evidence.json` retain their independent exact schema `1.0` contracts; all current core files, Markdown, and numbered append-only assets remain governed by the accepted Artifact lifecycle.

- **AC-XCLI-009-01:** Every new `run.json` uses schema `2.0` and the exact closed top-level provenance nodes in this delta; the same run's `analysis-contract.json` and conditional `evidence.json` continue to use schema `1.0`, and their closed field sets plus the successful file/asset inventory remain unchanged.
- **AC-XCLI-009-03:** Application writes product `xanthil/1.0.0` from Application-owned constants, runtime/Adapter/model from the closed preflight observation, and profile `personal` from Profile composition; Storage and CLI only validate, persist, return, or transport those values and never invent or normalize them.

`AC-XCLI-009-02` and `AC-XCLI-009-04` remain unchanged.

### REQ-XCLI-012 — Human Summary and Evidence Views

The Requirement statement, `AC-XCLI-012-01`, and `AC-XCLI-012-03` remain unchanged.

- **AC-XCLI-012-02:** `evidence.md` resolves `F-001` through its Evidence Items to source identity, time windows, SQL, Python validation, outputs, and checksums; product/runtime/Adapter/Profile/model provenance resolves from the same-run `run.json` rather than being duplicated into `evidence.json` or Markdown.

### REQ-XCLI-015 — Complete Neutral Provenance Without Credential Capture

Every successful run SHALL record the source snapshot, confirmed semantics, transformations, validation, product, runtime, Adapter, Profile, provider/model, lifecycle time, run identity, and Artifact checksums needed to reproduce each material calculation without persisting credentials, relying on Pi memory, or naming Pi in a schema key.

- **AC-XCLI-015-01:** `run.json` schema `2.0`, `analysis-contract.json` schema `1.0`, and `evidence.json` schema `1.0` jointly resolve each Finding to exact fixture bytes, the Adapter-observed source read time, inclusive business-date windows, canonical SQL and Python assets, outputs, Application-owned Xanthil `1.0.0`, Profile-owned `personal`, Pi Adapter-declared `agent-pi/1.0.0`, loaded-SDK-observed runtime `pi/0.84.2`, preflight-observed explicit `minimax-cn/MiniMax-M3`, and the same `run_id`.

`AC-XCLI-015-02` remains unchanged.

### REQ-XCLI-016 — Activation, Bounded Compatibility, Rollback, and Retirement

Run Manifest `2.0` SHALL activate only in the Personal local Profile after all gates pass; all new writes and mutations SHALL be current-`2.0` only; terminal read SHALL support only exact terminal `1.0` and exact terminal `2.0`; rollback and retirement SHALL preserve all user-owned Artifacts.

- **AC-XCLI-016-02:** `readTerminalRun({run_id})` accepts exact `succeeded`, `failed`, and `cancelled` Run Manifests for schema `1.0` and `2.0`; it returns the exact parsed legacy `1.0` structure with legacy keys intact, verifies indexed assets, and leaves the complete directory tree and `run.json` bytes unchanged. Legacy `1.0 in_progress`, unknown versions, and malformed records fail closed without normalization, backfill, rewrite, repair, or read-as-terminal behavior.
- **AC-XCLI-016-03:** `beginRun`, `commitConfirmedContract`, `appendAsset`, `replaceManifest`, and `commitSuccess` admit only a current schema `2.0` run and leave legacy/unknown bytes untouched on rejection. Rollback disables new activation and preserves every artifact; the previous implementation is not promised to read schema `2.0`, and no retained reader or migration machinery is added.

`AC-XCLI-016-01` and `AC-XCLI-016-04` remain unchanged.

### REQ-XTS-003 — Accepted Behavior and Boundary Parity

The Requirement statement and `AC-XTS-003-01`, `AC-XTS-003-03`, `AC-XTS-003-04`, and `AC-XTS-003-05` remain unchanged.

- **AC-XTS-003-02:** All business, failure, security, cancellation, deadline, atomicity, terminal, and non-provenance assertions accepted by the TypeScript migration remain unchanged. The four layers retain the migration baseline cases and may add only the independently scheduled assertion groups required by `CHG-runtime-provenance-neutralization`; Test Design freezes the resulting exact counts before TDD_READY, and no unrelated assertion or TEST identity is removed, renamed, or weakened.

## Explicitly Unchanged Requirements

`REQ-XCLI-002`, `REQ-XCLI-003`, `REQ-XCLI-004`, `REQ-XCLI-005`, `REQ-XCLI-006`, `REQ-XCLI-008`, `REQ-XCLI-010`, `REQ-XCLI-011`, `REQ-XCLI-013`, and `REQ-XCLI-014` remain unchanged in full. Every unchanged AC inside the modified Requirements remains authoritative as stated above. All `REQ-XTS-*` requirements other than the one count/evidence wording replacement remain unchanged.

## Compatibility Boundaries

- No generic dual-read dispatcher, version registry, migration marker, normalization layer, or background scan is authorized.
- Legacy read support is limited to explicit `readTerminalRun({run_id})`; no CLI list/inspect/resume/repair feature is added.
- Existing failure codes/stages and their boundary mappings remain unchanged.
- Exact legacy `1.0` validation preserves the currently accepted legacy model rule; new `2.0` writes use only the exact two-field model object above.

## Non-Requirements Added by This Change

- No second Runtime, Runtime registry/discovery/fallback/hot switching, universal Runtime Port, new Port method, or vendor-name branch in Application.
- No Profile configuration field, `profile.version`, package/lock/dependency change, SDK/package manifest lookup, or model/provider change.
- No data, fixture, DuckDB/Python, Evidence schema, Analysis Contract schema, Markdown content, enterprise, migration, repair, retention, recovery, or action behavior.
- No user run-directory inspection and no real model/provider call.
