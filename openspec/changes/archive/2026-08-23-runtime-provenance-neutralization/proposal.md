# Runtime Provenance Neutralization Proposal

## Change

- Change ID: `CHG-runtime-provenance-neutralization`
- Capability: `local-analysis`
- Classification: boundary change, R2 evidence
- Difficulty: complex but fully decided
- Delivery path: full Change workflow; `greenfield_fast_path` is not applicable because a durable compatibility obligation exists
- Accountable user: Data Analyst
- Implementation/rollback baseline: `1ba80d419e79f08f0002d17840c7cad92edc103c`

## Why

The current Run Manifest is valid for the accepted first slice but names Pi in public property keys. That makes a concrete Adapter define a JuanerAI versioned business contract and obscures which layer actually observed each provenance value. Before any second Runtime can be proposed, the current Personal flow needs an honest replaceable boundary.

This Change neutralizes the durable Run provenance schema. It does not add a second Runtime or make Runtime selection dynamic.

## Exact User-Observable Delta

Every newly created Personal local-analysis run returns and persists `run.json` schema `2.0` with this exact provenance value for the approved composition:

```json
{
  "product": { "id": "xanthil", "version": "1.0.0" },
  "runtime": { "id": "pi", "version": "0.84.2" },
  "adapter": { "id": "agent-pi", "version": "1.0.0" },
  "profile": { "id": "personal" },
  "model": { "provider": "minimax-cn", "model_id": "MiniMax-M3" }
}
```

Pi may be a value and is never a field name. There is no `profile.version`. Existing exact terminal schema `1.0` runs remain readable through `readTerminalRun` without mutation or normalization. No other Data Analyst journey, Finding, Evidence, Summary, source, metric, timing, cancellation, security, or failure behavior changes.

## Objectives

- Give new Run Manifests one smallest closed Runtime-neutral provenance shape.
- Keep provenance authority explicit: Application owns product identity/version; Profile supplies profile identity; Adapter observes or declares runtime/adapter/model values; Application remains the only semantic writer.
- Persist the preflight-observed model and fail closed if execution observes a different model.
- Support exact terminal `1.0` and terminal `2.0` reads while keeping every mutation current-`2.0` only.
- Preserve legacy bytes and artifacts without scan, migration, backfill, normalization, repair, or rewrite.
- Preserve the existing Port method sets, Profile external configuration, dependencies, and local-analysis execution behavior.

## Scope

- Run Manifest `2.0` current type and closed validation.
- Exact legacy terminal Run Manifest `1.0` read validation.
- Bounded response change to `AgentAnalysisRuntime.preflightModel` from model identity to neutral closed readiness.
- Pi Adapter runtime/adapter declarations, loaded SDK `VERSION` observation, and actual model observation.
- Internal Personal Profile identity flow into Application.
- Application composition and propagation of neutral provenance through `in_progress`, `succeeded`, `failed`, and `cancelled` manifests and public results.
- Local Artifact Store current-write/dual-terminal-read admission.
- Affected existing tests, doubles, module-hook SDK fixture, coverage mapping, and complete R2 evidence.

## Reused Unchanged Authority

The Change reuses:

- the exact Personal Profile selection of Pi and `minimax-cn/MiniMax-M3`, with no fallback;
- the `AgentAnalysisRuntime` method set `preflightModel`, `openSession`;
- the complete `LocalAnalysisExecution` Port and DuckDB/Python behavior;
- the `RunArtifactStore` method set and all atomicity, cancellation, deadline, immutability, and asset rules;
- Application as sole semantic writer and the Profile as composition root;
- analysis-contract and Evidence Index schema `1.0` contracts;
- the complete synthetic fixture, oracle, Finding, Summary, Evidence, error vocabulary, source/egress/security boundaries, and all unrelated `REQ-XCLI-001..016` behavior;
- the current 22 `TEST-XCLI-*` identities and existing public module exports.

## Path Policy

### Spec role — now

Allowed: `openspec/changes/runtime-provenance-neutralization/**` only.

Forbidden: current spec, production, tests, fixtures, dependencies, project board, architecture/governance, archived history, and Git state.

### Test role — only after Spec Gate

Allowed:

- `tests/unit/xanthil-local-analysis/local-analysis.unit.test.ts`;
- `tests/contract/xanthil-local-analysis/local-analysis-ports.contract.test.ts`;
- `tests/integration/xanthil-local-analysis/local-analysis.integration.test.ts`;
- `tests/e2e/xanthil-local-analysis/local-analysis.e2e.test.ts`;
- `tests/fixtures/xanthil-local-analysis/port-contracts.ts`;
- `tests/fixtures/xanthil-local-analysis/cli-profile-harness.ts`;
- `tests/fixtures/xanthil-local-analysis/coverage-map.ts`; and
- `tests/fixtures/xanthil-local-analysis/pi-sdk-failure-child.ts`, `pi-sdk-failure-hook.ts`, and `pi-sdk-failure-sdk.ts` only for local SDK `VERSION` observation/failure evidence.

Conditional with Controller release only after a demonstrated executable need: `tests/fixtures/xanthil-local-analysis/public-seams.ts` and `fixture-oracle.ts`. The CSV is never conditional.

Forbidden: all production, package/lock/config, current spec/archive, architecture/governance, canonical runner, project board, user run directories, real model/provider calls, and every other path.

### Worker role — only after TDD_READY

Allowed:

- `packages/product-core/local-analysis.ts`;
- `packages/ports/local-analysis.ts`;
- `packages/application/local-analysis.ts`;
- `adapters/agent-pi/local-analysis.ts`;
- `adapters/storage-local/local-analysis.ts`; and
- `profiles/personal/local-analysis.ts`.

Conditional with Controller release only if frozen executable RED proves it necessary: `apps/cli/xanthil.ts`. The CLI may validate/transport the current manifest but may not invent provenance or add a command/configuration.

Forbidden: tests/fixtures, DuckDB/Python Adapter, CSV/datasets, package manifest/lock, dependencies, current spec/archive, architecture/ADR/governance, project board, user run directories, scripts for migration/backfill/repair, generated output, and every other path.

The current capability spec is a Controller-owned merge target only after acceptance. Architecture/ADR edits require a future Controller-approved contract request and are not part of this Change write set.

## Out of Scope

- A second Runtime, DeepSeek Harness, Runtime registry/discovery, fallback, retry, hot switching, mid-Run switching, or universal Runtime abstraction.
- A new Port method, generic provenance registry, package lookup, runtime lookup, or vendor-name branch in Application.
- User-configurable Profile identity or any change to the four external Profile fields.
- Any model/provider change or duplicated model identity under `runtime`.
- Changing `analysis-contract.json` or `evidence.json` from schema `1.0`, or adding provenance fields to them.
- Migration, normalization, backfill, rewrite, repair, resume, or deletion of legacy runs; inspection/listing of user run directories.
- Retained compatibility reader beyond the specified exact terminal `1.0`/`2.0` path.
- Dependency, manifest, lock, DuckDB/Python, fixture/data, real-model, enterprise, identity, tenancy, policy, audit, retention, recovery, or action behavior.

## Activation

Activation is limited to the existing Personal local Profile after Spec Gate, expected RED, TDD_READY, minimum implementation, GREEN, affected Agent Runtime and Run Artifact contracts, full offline regression, Test Asset Retirement Gate, independent verification, and Controller acceptance. All new runs then write only schema `2.0`.

## Rollback

Rollback disables the new activation and restores the previous code/composition from the implementation baseline. It does not delete, rewrite, normalize, migrate, repair, or inspect any artifact. Schema `2.0` runs remain user-owned; the previous implementation is not promised to read them. Rollback adds no retained reader or dual-writer machinery.

## Evidence Level and Stop Lines

R2 requires causal expected RED, current and legacy closed-schema mutation coverage, unchanged Adapter method sets, both affected Adapter contract suites, focused integration/E2E evidence, strict typecheck, canonical offline validation with the real-model gate absent, scope/secret/data checks, Test Asset Retirement Gate, and fresh read-only validation.

Return to the Controller on any unresolved schema/owner/version ambiguity; need for a new Port method, new Runtime, registry, fallback, vendor branch, migration/repair, dependency, external Profile option, architecture contract drift, user-directory inspection, real provider call, or path outside the frozen policies.
