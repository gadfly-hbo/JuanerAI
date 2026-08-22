# Exploration: Xanthil Run & Evidence Viewer

## Intake

- Change: `CHG-run-evidence-console`
- Branch: `work/mac-mini/run-evidence-console`
- Accountable user: Data Analyst
- Product goal: let a user select one existing local Xanthil Run and inspect its analysis contract, Findings, Evidence, reproducible assets, provenance, limitations, terminal failure information, contract version, reference integrity, and checksum results.
- First acceptance scenario: a user selects one local Run produced under Artifact contract `1.0`; the Console presents the applicable successful or non-successful read model and integrity results without changing any file or invoking a model.
- Data boundary: local Xanthil Run files only. No provider/model call, network access, source-row discovery, credential access, external data access, or project-control data access is authorized.
- Technical constraints: native TypeScript in the current no-emit runtime; read-only composition; separate Experience, Application, Product Core, Port, Adapter, and Personal Profile seams; no dependency installation or package/schema change is authorized at Explore.

## Requested Scope

The requested first slice shows:

- analysis question, source descriptor, time windows, and metric definitions;
- Finding-to-Evidence relationships;
- SQL, Python validation, and numbered output assets;
- source, Runtime, model, Adapter, version, and checksum provenance;
- limitations, terminal stage, and stable error code where applicable; and
- exact contract version, reference-integrity, and checksum-verification results.

The requested first slice does not rerun, edit, delete, repair, migrate, approve, decide, recommend an Action, execute an Action, invoke a model, or introduce enterprise identity, authorization, tenancy, audit, retention, concurrency, or recovery behavior.

## Authorities Examined

- `AGENTS.md`, `CONTEXT.md`, and `Orchestration.md`.
- `docs/architecture/`, including dependency, Profile, data-authority, and security boundaries.
- `docs/governance/change-complexity-control.md`, `docs/governance/xanthil-first-slice-reuse-baseline.md`, `docs/governance/test-asset-retirement.md`, and `docs/governance/agent-model-routing.md`.
- `.ai-coding/policies/testing.md` and `.ai-coding/definition-of-done.md`.
- `openspec/specs/local-analysis/spec.md`, especially REQ-XCLI-009 through REQ-XCLI-016.
- Current Product Core, Port, Application, local-storage Adapter, Personal Profile, CLI, package manifest, and indexed code graph at `0e796a1884c682f71ed5146d2c4e714a064f5b97`.

## Reusable Baseline

The viewer can reuse these accepted contracts without changing their stored shape or writer behavior:

- REQ-XCLI-009: closed Artifact contract `1.0`, core filenames, numbered asset inventory, and terminal immutability.
- REQ-XCLI-010: the four statuses and the distinction between succeeded, failed, cancelled, and an in-progress abandoned candidate.
- REQ-XCLI-011 and REQ-XCLI-012: Finding/Evidence references, Markdown projection status, and checksum obligations.
- REQ-XCLI-013: incomplete candidate files never become a success claim.
- REQ-XCLI-014 and REQ-XCLI-015: no credential capture and complete provenance.
- REQ-XCLI-016: exact supported versions fail closed and rollback preserves user-owned terminal Artifacts.
- `createLocalAnalysisDomain()` already exposes validators for Run Manifests, Evidence indexes, terminal outcomes, Markdown projections, Findings, and the frozen analysis proposal.
- The current local-storage Adapter already demonstrates safe containment, regular-file reads, SHA-256 verification, manifest validation, and terminal immutability, but it exposes those reads through the write-capable `RunArtifactStore`; the new experience must not receive that write-capable Port.

The new reader therefore has a feasible independent boundary: a read-only business Port, a local filesystem Adapter, a query Application, a read-model Product Core module, a Personal Console composition root, and an Experience surface. Existing local-analysis writer modules need not change to implement physical reading.

## Intended New Paths

- `apps/console/**`
- `packages/application/run-evidence-query.ts`
- `packages/product-core/run-evidence.ts`
- `packages/ports/run-evidence-reader.ts`
- `adapters/storage-local/run-evidence-reader.ts`
- `profiles/personal/console.ts`
- Change-specific tests and OpenSpec artifacts after their Gates

## Frozen Forbidden Paths

- `apps/cli/**`
- `packages/application/local-analysis.ts`
- `packages/product-core/local-analysis.ts`
- `packages/ports/local-analysis.ts`
- `adapters/agent-pi/**`
- `adapters/analytics-duckdb/**`
- `adapters/storage-local/local-analysis.ts`
- `profiles/personal/local-analysis.ts`
- current Runtime behavior and the write-capable Run Artifact Store
- `package.json`, `package-lock.json`, and dependency installation without a later explicit approved delta

If a later Spec, Test, or Worker requires any forbidden writer/shared-code path, the Change returns to Contract Change Request rather than editing it.

## Contract Conflict

`openspec/specs/local-analysis/spec.md` AC-XCLI-016-04 normatively says that `Console` remains unavailable. Activating even a separate, read-only Console would contradict that accepted baseline. This is true even though no Artifact field, Port method, Runtime, writer, Profile, or CLI contract needs to change.

Consequently the Change cannot proceed to a complete OpenSpec package or Spec Gate under the user's no-shared-contract-change stop line. The smallest possible resolution is the adjacent `contract-change-request.md`: remove only the global Console prohibition, preserve Artifact `1.0` and every local-analysis producer behavior, and let a new capability spec own the reader contract.

## Change Classification and Routing

- Class: boundary change.
- Risk/difficulty: R2 / standard.
- Rationale: the slice adds a durable read-only Port and local filesystem Adapter across several layers, consumes persistent Artifacts, and defines fail-closed path/checksum/reference semantics. It does not change persistence or introduce external effects.
- Expected evidence after approval: new Product Core unit tests, an unchanged driver against the read-only Port Adapter and a deterministic double, Application/Adapter integration tests with malformed and tampered Run fixtures, an Experience/Profile E2E journey, full affected regression, Test Asset Retirement Gate, and independent read-only validation.
- Routing constraint: the R2 Spec route is Sol/high, while the configured `juaner_spec` role is fixed to Terra/medium. If the contract request is approved, the Controller must record the unavailable-route constraint before mandatory Spec dispatch; risk is not downgraded.

## Explore Verdict

`READY_FOR_SPEC`.

The user approved `REC-CONTRACT-001` on 2026-08-22. No production, test, dependency, schema, package, or current `local-analysis` baseline file has been changed. The Spec role may now draft the bounded delta package; the current baseline is updated only after acceptance/archive.
