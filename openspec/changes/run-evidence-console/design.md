# Design: Xanthil Run & Evidence Console

## Architecture

```text
Data Analyst
  -> `node apps/console/xanthil-console.ts --run <absolute-run-directory>`
  -> Node standard-library loopback Web Experience
  -> RunEvidenceQuery Application -> RunEvidenceReader Port <- Local Adapter
                                  -> Run Evidence Product Core (pure admission + projection)
  <- Personal Console Profile (composition of Application, Port, Adapter)
```

The Experience passes one explicit selection to Application and renders only its closed result. Application invokes one reader query through `RunEvidenceReader`, receives admitted local observations in business/standard-platform values, and passes them to Product Core; it performs no filesystem interpretation. Product Core has no filesystem, Port, Runtime, SDK, model, source-data, or Profile dependency. It reuses the existing `createLocalAnalysisDomain()` Run Manifest and Evidence Index validators unchanged. The new reader Core owns exact Artifact-`1.0` admission of the persisted `analysis-contract.json` snapshot, including every nested field and accepted relationship, without importing a private Application function; it adds no producer schema, shared validator export, writer method, default/coercion, or future Runtime contract. It also owns only reader-specific checksum/reference, neutral projection, textual-asset display admission, and result rules. The Port describes one `readSelectedRun` operation in business values and has no mutating method. The Adapter implements that Port, performs the bounded two-phase local observation order, and returns admitted observations without filesystem handles or paths selected by Core. The Profile selects that Adapter. No writer surface, including `RunArtifactStore`, is imported or exposed.

## Input, Admission, and Linearization

The input is exactly one `--run <absolute-run-directory>` argument; missing, duplicate, or unknown arguments fail before Profile creation, Artifact read, or host bind. No run root exists in reader configuration and none is inferred. The one Port operation has two physical phases without a second Port method: first it observes only fixed `run.json`, after realpath containment/regular/non-symlink/stability checks; it fatal-UTF-8/duplicate-member decodes and invokes the unchanged Run Manifest validator. Before that closed manifest acceptance no other pathname is derived, probed, opened, or atime-touched. Only then may the Adapter derive fixed and validated descriptor paths and apply containment/regular/stability checks. For manifest-indexed assets it compares stable regular-file metadata with the exact declared `byte_size` before/while reading; Core checks observed `byte_size` plus SHA. Analysis-contract/Evidence descriptors have SHA-only integrity, so no reader size threshold is invented. Core independently performs authoritative full Artifact admission on those observations.

The scope does not promise isolation from a hostile concurrent local filesystem writer or hostile resource exhaustion. The personal profile is a shared local trust boundary. If observed bytes/metadata change, cannot be read, or fail a checksum/shape check, the query returns a reader failure and never a verified result. No maximum file-size policy, lock, retry, repair, background scan, streaming, or recovery protocol is added; a future maximum size requires a separate explicit product/contract decision.

## Status Read Algorithm

1. Validate selection and accept only phase-one `run.json` as exact `1.0`; validate directory basename/run ID before every other physical read.
2. After manifest acceptance, read the declared `analysis-contract.json` only when present and needed for the requested status result. Reader Core fatal-UTF-8/duplicate-member decodes and fully admits its closed persisted Artifact-`1.0` snapshot (time, question/objective, sources, windows, metrics, signal/output/constraints and relationships) before projection.
3. For `succeeded`, require and validate all declared successful records: Evidence Index, six frozen indexed assets (`Q-001`, `S-001`, `O-001`, `O-002`, `DOC-SUMMARY`, `DOC-EVIDENCE`), their fixed paths/categories/media types, and the success Evidence descriptor. Shape/enum/format failures are read failures; only after shape admission do duplicate/foreign/dangling/wrong-kind/pointer relationships become reference failures. Verify core-file SHA only, indexed asset byte size plus SHA, and strict UTF-8 textual display content. Only then produce `verified_succeeded`.
4. For `failed`, `cancelled`, and `in_progress`, read only `run.json` plus retained manifest-indexed files that can be safely observed. Project the permitted terminal envelope and asset integrity metadata. If a retained file is malformed/unsafe/checksum-disagreeing, reject rather than invent a partial success. A missing uncommitted contract or evidence document does not convert a valid non-success Run into completed content.
5. Markdown is shown only as a byte-verified document associated with its descriptor; all semantic fields remain machine-contract values.

The adapter does not enumerate sibling Runs or recursively discover files. Reference-integrity scope is the closed `run.json` catalog and the required success layout, not an unapproved scan for unrelated files.

## Loopback Experience Lifecycle

The process parses the single argument, composes the Profile, obtains exactly one closed reader result, then freezes it before host creation. A rejected result prints only its sanitized diagnostic to stderr, exits nonzero, and never listens. A verified result starts a Node standard-library HTTP server on `127.0.0.1` with port `0`; after listen it prints exactly the assigned loopback root URL. It neither opens a browser nor reads the Run again. `GET /` returns one escaped `text/html; charset=utf-8` document which renders the result's status, applicable integrity outcomes, and status-authorized view. Every other path/method is `404`. The document contains no form, client-side script, selection mechanism, data-fetch endpoint, directory link, or Artifact mutation capability. Ctrl+C only closes the listener and exits.

## Read-model Boundaries

For success, Core builds an immutable closed projection containing: run identity/status/times; confirmed contract; source descriptors; windows; metric definitions; Finding/Evidence graph; labelled strict-UTF-8 display text for accepted SQL, Python, JSON/output, and Markdown assets; limitations; and applicable ordered integrity entries. Its only provenance value is the exact neutral Artifact-`1.0` viewer object `{ recorded_product_version, recorded_agent_runtime_version, recorded_agent_adapter_version, recorded_model: { provider, model_id } }`, mapped from the retained Artifact source roles. It contains no vendor/raw legacy field/anonymous version array/optional record, creates no Runtime selection or branch, and neither defines nor promises compatibility with a future Runtime provenance contract. Artifact `1.0` does not contain a separate analytical-engine Adapter version, so the reader neither displays nor infers one. `sources[].path` is display metadata only; it is never opened. Textual assets are display data only and never executable instructions.

For non-success, Core builds only status, available lifecycle/provenance fields permitted by the manifest, terminal detail, retained asset descriptors/integrity, and the `abandoned candidate` label for `in_progress`. It omits all Finding/Evidence/Markdown success content. A rejected result contains no partially assembled success projection.

## Failure Semantics

| Condition | Result |
|---|---|
| bad direct selection, escape, symlink, non-regular file, malformed document, or identity mismatch | `RUN_READ_FAILED` |
| unsupported version | `RUN_CONTRACT_UNSUPPORTED` |
| dangling/foreign/wrong-kind ID or pointer | `RUN_REFERENCE_INVALID` |
| observed size/hash disagreement | `RUN_CHECKSUM_MISMATCH` |
| other sanitized local read failure | `RUN_READ_FAILED` |

The writer's `stage` and error code are displayed exactly where persisted for non-success; the table is a reader vocabulary and does not add writer error values. No reader condition is repaired or rewritten.

## Data and Security

Inputs are only bytes beneath the user-selected Run directory. The query makes no network, model, process, source-file, credential/environment, project-board, database, or provider read. It writes nothing, including no cache, log, temporary file, lock, marker, or cleanup. Diagnostic text is sanitized and non-authoritative. This preserves the local trusted-process boundary but does not claim a sandbox, access policy, audit, retention, or enterprise control.

TEST-REC-005 alone uses a controlled temporary workspace whose declared source path is nonexistent or unreadable; before/after snapshots cover both the selected Run and all controlled workspace paths outside it. TEST-REC-008 alone proves by static filesystem-call/import closure that Adapter and Experience have no mutation call or `sources[].path` dereference. The host E2E supplies hostile persisted strings and asset bytes, and proves rendered HTML escapes them inertly without injected element, script, navigation, or execution.

## Activation and Operations

The Personal Console Profile is inactive until the stated gates pass. At the authorized Test/implementation step, `tsconfig.json` appends only the 14 paths frozen in accepted REC-CONTRACT-002, preserving the original 21 entries and every other toolchain behavior. Rollback/retirement removes only active Console composition and those exact Console entries together with the retired files under a later approved retirement Change; it neither inspects broadly nor changes any user-owned Artifact. Exact `1.0` support is a compatibility ceiling, not a migration plan.

## Rejected Alternatives

- Reusing or extending `RunArtifactStore`: rejected because it grants write capability to a read-only Experience and touches frozen producer code.
- Adding a run list/root scanner: rejected because the user must select exactly one Run and it broadens local data access.
- Treating Markdown as authority: rejected because Artifact `1.0` makes machine records authoritative.
- Enterprise identity/audit/locking: deferred; no present user need or approved authority.
