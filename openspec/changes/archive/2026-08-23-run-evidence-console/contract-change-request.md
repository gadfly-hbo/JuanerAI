# Contract Change Request: REC-CONTRACT-001

## Summary

Permit one separately specified, read-only Xanthil Run & Evidence Console to consume existing immutable local-analysis Artifact contract `1.0`. The request removes the current global prohibition on `Console`; it does not change any stored Artifact, writer, Port, Runtime, Personal local-analysis Profile, or CLI behavior.

## Current Contract

- Source: `openspec/specs/local-analysis/spec.md`, AC-XCLI-016-04.
- Meaning and behavior: Session resume, run list/delete/repair, retention automation, real data, additional formats, Web Research, Workflows, Desktop, **Console**, enterprise behavior, SQLite, Trace Platform, Ontology, Knowledge, Memory, Domain Packs, Model Packs, Decisions, recommendations, and Actions remain unavailable.

The bolded item directly conflicts with the approved product task. REQ-XCLI-009-04 otherwise already permits later read-only display and verification of terminal files.

## Proposed Contract

- Meaning and behavior: remove only `Console` from AC-XCLI-016-04's unavailable list. A new `run-evidence-console` capability may expose a separately approved read-only consumer of existing local Run Artifacts.
- Shape: Artifact contract `1.0`, all JSON/Markdown/numbered-asset shapes, identity, ordering, lifecycle, checksum fields, and producer semantics remain byte- and behavior-compatible. The new capability owns its own read model and `RunEvidenceReader` Port; it does not add a method to `RunArtifactStore` or export its write capabilities to Experience.
- Failure semantics: existing local-analysis failure semantics remain unchanged. The new reader spec must fail closed on unsupported versions, unsafe or escaping paths, symlinks or non-regular files, malformed or unknown fields, identity mismatch, missing/foreign/dangling references, checksum mismatch, and incomplete success publication. It must never repair, rewrite, delete, migrate, rerun, call a model, or present an unverified candidate as successful. Exact new reader error names remain pending Spec and may not be inserted into the existing writer vocabulary by this request.

## Reason and Evidence

The user approved a first Console slice whose product value is inspection of existing analytical results, Evidence, and provenance. The accepted Artifact baseline already contains the required source, contract, lifecycle, Runtime/model, asset, Evidence, limitation, error, version, and checksum information. Code-graph exploration also shows that Product Core already owns much of the relevant validation, while the current local filesystem store combines its read helper with a write-capable Port. A separate read-only Port preserves least capability and avoids exposing mutation methods.

Without this minimal normative delta, a new Console would violate AC-XCLI-016-04 even if its implementation never touches existing local-analysis files. This request records that conflict before Spec or implementation, as required by the user's cross-device stop line.

## Affected Domains

| Domain | Impact |
|---|---|
| product-governance | minimal accepted-baseline delta removing only the Console prohibition; new capability spec after approval |
| experience | new read-only Console surface; no CLI change |
| core | new run-evidence read model, query Application, and read-only business Port in new files |
| runtime-data | new local filesystem reader Adapter and Personal Console composition root in new files |
| quality | new unit, Port-contract, integration, E2E, negative, and forbidden-side-effect evidence |
| local-analysis producer | no Artifact, Runtime, writer, current Port, current Profile, or CLI code change |

## Compatibility

- backward compatible: yes for all existing Run producers and Artifacts; it enables a previously prohibited consumer without altering producer output.
- migration or backfill: none; only exact supported Artifact `1.0` Runs are readable.
- activation: only after a new `run-evidence-console` OpenSpec package passes Spec, RED, GREEN, regression, Test Asset Retirement, independent verification, and acceptance Gates.
- rollback: disable/remove the Console composition and reader modules; preserve all user-owned Runs without mutation.
- retirement: remove the Console from active composition only; do not delete, rewrite, repair, migrate, or reclassify Runs.

## Validation

- positive: an exact successful Artifact `1.0` Run produces a verified read model resolving its contract, Finding, Evidence, assets, provenance, limitations, and checksums; failed/cancelled/in-progress Runs receive only their contractually allowed non-success view.
- negative: unsupported version, path escape, symlink, non-regular file, malformed/extra/missing field, run identity mismatch, missing or dangling reference, missing or unindexed asset, checksum mismatch, and success-publication inconsistency all fail closed or render an explicitly unverified/non-success result according to the later approved spec.
- integration: the new local Adapter and a deterministic double pass one unchanged `RunEvidenceReader` contract suite; filesystem snapshots before/after all reads prove zero product writes, model/network calls, reruns, deletes, repairs, or current writer-Port calls.

## Controller Decision

- status: accepted
- rationale: the user explicitly approved `REC-CONTRACT-001` in the Codex task on 2026-08-22. The accepted authority is limited to removing the `Console` prohibition from AC-XCLI-016-04 through this Change's delta specification and specifying a separate read-only consumer. It does not authorize any Artifact shape, writer, existing Port, Runtime, current Profile, CLI, dependency, migration, repair, deletion, model, or enterprise behavior change.
