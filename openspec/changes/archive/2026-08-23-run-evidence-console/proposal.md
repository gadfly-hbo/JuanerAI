# Proposal: Xanthil Run & Evidence Console

## Decision

- Change: `CHG-run-evidence-console`
- Class: boundary change; R2 / standard.
- Accountable user: Data Analyst.
- Product objective: permit an analyst to explicitly select one existing local Xanthil Artifact `1.0` Run and inspect its evidence-backed analysis and provenance without causing any product or filesystem mutation.
- Delivery objective: add one separately composed, least-capability reader surface while preserving all local-analysis producer behavior byte- and behavior-compatible.
- Learning objective: establish whether the accepted Artifact `1.0` contract is sufficient for a read-only, integrity-verifying result viewer without reopening its writer, Runtime, CLI, or Profile contracts.

## Why and Scope

The accepted producer makes terminal Artifacts immutable and explicitly permits later read-only display and verification. Its current global Console prohibition is the sole normative conflict; user-approved `REC-CONTRACT-001` removes only that item. The Console consumes exactly one user-nominated local Run directory. For a valid succeeded Run it presents the confirmed analysis question, source descriptor (not source rows), windows, metric definitions, Findings and Evidence mappings, indexed SQL/Python/output assets, persisted Runtime/Adapter/model provenance as a neutral viewer-only projection, limitations, machine-contract version, and applicable integrity outcomes. The reader does not invent an analytical-engine version absent from Artifact `1.0`. For a valid non-success Run it presents only its non-success terminal information and any integrity information that can be obtained without treating partial content as completed analysis.

## Non-goals

- Run discovery, listing, workspace/run-root scanning, resume, rerun, edit, deletion, repair, migration, backfill, or retention.
- Any write, model/provider/network call, source-row dereference, credential/environment/project-control access, or use of the write-capable Run Artifact Store.
- Decision, recommendation, Action, approval, or action execution.
- Desktop, TUI, browser auto-launch, any host other than the approved loopback local Web Console, enterprise identity, authorization, tenancy, audit, retention, isolation, concurrency, recovery, or availability promises.

## Reuse, Delta, and Compatibility

- Reused unchanged: local-analysis Artifact `1.0` filenames, closed JSON fields/enums/order, IDs, checksums, status lifecycle, writer error vocabulary, Runtime, ports, CLI, current Personal Profile, and producer tests. The reader reuses only the existing `createLocalAnalysisDomain()` Run Manifest and Evidence Index validators unchanged, never the writer Port or Adapter. Its own Core admits the persisted `analysis-contract.json` snapshot exactly as Artifact `1.0` reader input; this adds no producer schema, shared export, writer behavior, default, coercion, or future Runtime contract.
- Delta: a new `RunEvidenceReader` business Port and reader-owned neutral projection consume the frozen contract; `AC-XCLI-016-04` loses only the word `Console` through this Change's delta spec.
- Compatibility: exact Artifact version `1.0` only; no dual-read, migration, or producer change. Existing and newly produced valid Runs remain consumable.

## Boundary and Dependencies

| Kind | Paths / authority |
|---|---|
| allowed | the six production and eight test/fixture/helper paths named exactly in accepted REC-CONTRACT-002; REC-CONTRACT-003's one named existing test path; this Change's OpenSpec delta specs |
| conditional | root `tsconfig.json` only at the authorized Test/implementation step, only to append the exact 14 REC-CONTRACT-002 paths while preserving all original 21 entries/options; any other shared path needs a Controller-accepted CCR |
| forbidden | all current local-analysis producer/writer paths except one unchanged import of the pure `createLocalAnalysisDomain()` validator surface; `apps/cli/**`, write-capable Artifact Store, Runtime/Agent/analytics adapters, every other package/toolchain/current-baseline path, data sources, project control, and enterprise facilities |

Dependencies are the accepted local-analysis capability spec and its exact Artifact `1.0` semantics, accepted REC-CONTRACT-001/002/003, and Node standard-library HTTP facilities already in the no-emit baseline. REC-CONTRACT-002's 14 paths are covered by this Change's local-analysis XTS delta; at the authorized Test/implementation step only, `tsconfig.json` may append that exact inventory. REC-CONTRACT-003 authorizes only TEST-XCLI-021's accepted graph-expectation correction. No other toolchain change, external service, schema generation, or model/runtime activation is authorized.

## Activation, Rollback, and Retirement

Activation occurs only after Spec Gate, Test-owned causal RED, Worker GREEN, focused and canonical offline regression, Test Asset Retirement PASS, independent validation, and Controller acceptance. The entry is exactly `node apps/console/xanthil-console.ts --run <absolute-run-directory>`. One process admits one explicit Run, builds its frozen read model, then starts a Node standard-library HTTP host bound only to `127.0.0.1` on OS-assigned port `0`; it prints the resulting loopback URL, does not open a browser, and Ctrl+C stops that host. Rollback disables this entry/composition; retirement removes it from active composition. Neither may delete, alter, repair, migrate, or reclassify any selected Run, and neither changes the producer.

## Fixed Experience Decision

The Node standard-library loopback Web host is the sole approved Experience for this Change. It serves the one frozen read model for the selected Run only; the UI has no selection control, browse/list/scan/switch operation, write action, or API for another path. The process emits no browser-launch request and binds no non-loopback interface.
