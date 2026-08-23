# Xanthil Run & Evidence Console Specification

## Capability Contract

- Change: `CHG-run-evidence-console`
- Capability: `run-evidence-console`
- Accountable user: Data Analyst
- Input contract: exactly one explicitly supplied absolute local Run-directory pathname per read request; no listing, discovery, run-root/workspace inference, or default selection.
- Entry contract: exactly `node apps/console/xanthil-console.ts --run <absolute-run-directory>`.
- Supported producer contract: exact local-analysis Artifact `1.0` only.

`SHALL`, `SHALL NOT`, `MUST`, and `MUST NOT` are normative. The capability is a reader of provenance-bearing analytical Artifact data, not an authority for a Decision, Action Recommendation, Action, Outcome, or source data.

## Reader Result Vocabulary

Every reader response is one closed, reader-owned result: `verified_succeeded`, `verified_non_success`, or `rejected`. A verified result contains only integrity checks applicable to its status, in frozen contract order. `rejected` exposes exactly one stable reader error code and sanitized non-authoritative diagnostics: `RUN_CONTRACT_UNSUPPORTED`, `RUN_REFERENCE_INVALID`, `RUN_CHECKSUM_MISMATCH`, or `RUN_READ_FAILED`. `RUN_READ_FAILED` covers invalid/missing selection, unsafe path or file, fatal UTF-8/JSON decode, duplicate object member at any depth, malformed/unknown/missing/null/wrong-type/enum/format/incomplete machine content, permissions, unsupported textual asset, and other local read failures. `RUN_REFERENCE_INVALID` applies only after shape-valid document admission to duplicate, foreign, dangling, wrong-kind, or unresolvable semantic relationships. `RUN_CHECKSUM_MISMATCH` applies only to declared hash/size disagreement. These codes neither replace nor extend the local-analysis writer failure vocabulary.

## Requirements

### REQ-REC-001 — Explicit, Read-only Selection

The Console Application SHALL request exactly one explicit Run-directory input and pass it to a read-only query; it SHALL create no inferred path, enumerate Runs, or expose a mutation command.

- **AC-REC-001-01:** Given one explicit absolute local directory input, the query reads only the selected directory and paths declared by the accepted Artifact contract beneath it; it does not list Runs, discover a workspace/run root, or use a default/current-directory input.
- **AC-REC-001-02:** Missing, relative, empty, malformed, inaccessible, or non-directory selection is `rejected` as `RUN_READ_FAILED` and causes no product write.
- **AC-REC-001-03:** The Experience receives only the query Application; it has no writer, Runtime, source-data, model, network, project-control, credential, or action capability.
- **AC-REC-001-04:** One invocation accepts exactly one `--run` value and cannot select, browse, list, scan, switch to, or receive another Run directory. A missing, duplicate, or unknown CLI argument exits without starting a host or reading an Artifact.

### REQ-REC-002 — Safe Artifact Admission

The reader SHALL admit only an exact, closed Artifact `1.0` representation and SHALL validate machine-readable documents before projecting any analysis content.

- **AC-REC-002-01:** `readSelectedRun` first observes only fixed `run.json` and verifies physical containment, regular/non-symlink file status, and stable observation before decoding. It rejects fatal UTF-8, duplicate JSON object-member names at any depth, and malformed/unknown/missing/null/wrong-type manifest content with `RUN_READ_FAILED`; it invokes the existing pure Run Manifest validator unchanged. Until that closed manifest is accepted, it SHALL NOT derive, probe, open, or update atime for any other path. Only then may it derive fixed or manifest-declared paths, each of which is physically contained beneath the selected non-symlink Run directory and is a regular non-symlink file rather than a device or directory. For every manifest-indexed asset that declares `byte_size`, Adapter checks stable regular-file metadata against that exact declared value before/while reading, and Core checks observed `byte_size` plus SHA; a mismatch or I/O instability is `RUN_READ_FAILED` or `RUN_CHECKSUM_MISMATCH` as applicable. Core analysis-contract/Evidence descriptors declare SHA but not size, so the reader does not impose a size ceiling on them.
- **AC-REC-002-02:** After manifest acceptance, the reader invokes the existing `createLocalAnalysisDomain()` Evidence Index validator unchanged for `evidence.json` when required by a succeeded manifest. New reader Product Core alone admits the persisted `analysis-contract.json` snapshot as the fully closed exact Artifact-`1.0` confirmed contract: its root has exactly `schema_version`, `run_id`, `confirmed_at`, `original_question`, `question`, `objective`, `source_ids`, `time_windows`, `metrics`, `signal_rule`, `output_requirements`, and `constraints`; every nested object/array, required order, ID, enum, date/timestamp/format, and accepted cross-reference SHALL match the accepted local-analysis Artifact-`1.0` confirmed-contract semantics for question/objective, `SRC-001`, baseline/recent windows, five metric definitions, signal rule, output requirements, and constraints. It rejects unknown/missing/null/wrong-type/enum/format/cross-reference defect, fatal UTF-8, or duplicate object member at any depth as `RUN_READ_FAILED`, without importing private Application functions or creating a producer schema, shared validator export, writer method, default/coercion, or future Runtime contract.
- **AC-REC-002-03:** `run.json`, `analysis-contract.json`, and `evidence.json` when present each have the same `run_id` as the selected directory basename. A mismatch is `RUN_READ_FAILED`; indexed JSON outputs are not required to contain `run_id`. Versions other than exact `1.0` are `RUN_CONTRACT_UNSUPPORTED` without migration, coercion, or fallback.

### REQ-REC-003 — Status-Discriminated Read Model

The query SHALL never present partial or non-success content as a completed analysis.

- **AC-REC-003-01:** A `succeeded` Run yields `verified_succeeded` only when it has the required contract, Evidence index, Summary/Evidence Markdown descriptors, required numbered assets, and all successful-publication invariants; otherwise it is `rejected` as the applicable version/reference/checksum/read failure.
- **AC-REC-003-02:** A valid terminal `failed` or `cancelled` Run yields `verified_non_success`, displays `status`, applicable `ended_at`, terminal stage, stable writer error code only where the frozen status allows it, and retained indexed asset metadata/integrity only. It SHALL NOT display a completed Finding, Evidence, Summary, Evidence document, conclusion, or a success label. A legacy Artifact `1.0 in_progress` Run is rejected as `RUN_READ_FAILED`; it is never projected or labelled as a terminal result.
- **AC-REC-003-03:** For `verified_succeeded`, the authoritative read model exposes the confirmed question, source descriptors (without opening source paths or returning source rows), time windows, metric definitions, Findings, Finding-to-Evidence links, Evidence-to-source/asset links, labelled display text for accepted indexed assets, limitations, exact contract version, and applicable integrity results. Runtime admission and serialized/runtime projection are exact and closed: no unadmitted or unknown Artifact field is emitted. The TypeScript reader-result envelope is closed to the three result variants in the Reader Result Vocabulary, and its exact neutral Artifact-`1.0` viewer provenance shape is `provenance: { recorded_product_version: string; recorded_agent_runtime_version: string; recorded_agent_adapter_version: string; recorded_model: { provider: string; model_id: string } }`; it maps the exact legacy Artifact-`1.0` values to those semantic roles. New Product Core, Application, Port, Profile, and Experience contracts SHALL expose no `vendor`, vendor name, raw legacy field name, anonymous version array, Runtime selection, or Runtime-vendor branch. Complete TypeScript closure of nested Artifact-derived View values (sources, windows, metrics, Findings, Evidence, retained assets, and status-specific detail) is explicitly deferred and is not a Console `1.0` Acceptance Criterion; this does not permit unknown fields at runtime. This view is only for Artifact `1.0`, neither defines nor promises compatibility with any future Runtime provenance contract, and a second Runtime remains a separate Change.

### REQ-REC-004 — Integrity and Reference Verification

The reader SHALL independently verify the declared evidence graph and persisted bytes before issuing `verified_succeeded`.

- **AC-REC-004-01:** It observes SHA-256 and byte size for `analysis-contract.json`, `evidence.json`, and every manifest-indexed asset required by the successful layout. It compares the observed SHA-256 of `analysis-contract.json` and `evidence.json` only with their declared path-and-SHA descriptors, and compares each indexed asset's observed byte size and SHA-256 with its declared descriptor; disagreement is `RUN_CHECKSUM_MISMATCH`.
- **AC-REC-004-02:** It resolves each Finding's Evidence IDs, each Evidence Item's source and artifact IDs, and each optional JSON Pointer only within the same Run and accepted output asset. Missing, duplicate, foreign, dangling, wrong-kind, or unresolvable references are `RUN_REFERENCE_INVALID`.
- **AC-REC-004-03:** `summary.md` and `evidence.md` are non-authoritative projections: their bytes/checksums and required successful descriptors are verified, but neither supplies or overrides a contract field, Finding, Evidence relation, provenance value, status, or integrity outcome. After checksum and shape admission, `Q-*` `application/sql`, `S-*` `text/plain`, `O-*` `application/json`, and `DOC-SUMMARY`/`DOC-EVIDENCE` `text/markdown` indexed assets are strict-UTF-8 decoded into labelled display text. Unsupported category/media-type mapping, malformed text, or decode failure is `RUN_READ_FAILED`; bytes are never projected as a Buffer/Uint8Array numeric array.

### REQ-REC-005 — Data, Security, and Side-effect Boundary

The reader SHALL retain the personal-profile local trust boundary while minimizing capability to local Artifact files.

- **AC-REC-005-01:** A read performs no write, rename, delete, chmod, repair, migration, temporary-file cleanup, rerun, or source-row read. TEST-REC-005 proves it with a controlled temporary-workspace before/after snapshot covering the selected Run and outside it, with a success fixture whose declared `sources[].path` is nonexistent or unreadable. TEST-REC-008 proves static filesystem-call/import closure showing Adapter and Experience contain neither mutation call nor source-path dereference. Absence of model, network, credential, project-control, writer, and action capability is proved by the public Port/Profile/import closure rather than effect-recorder machinery.
- **AC-REC-005-02:** The read model carries only persisted Artifact content and reader verification metadata. It does not dereference `sources[].path`, use filesystem mtime as data, expose credentials/endpoints/raw model transcripts, or claim sandbox, enterprise authorization, tenant isolation, audit, retention, or recovery behavior.
- **AC-REC-005-03:** I/O, decode, permission, or instability failures not classified above return `RUN_READ_FAILED` with sanitized diagnostics and no partial success read model.
- **AC-REC-005-04:** The local Web rendering treats every persisted Artifact string and asset byte as display data: it escapes rendered text and never executes Markdown, SQL, Python, or output content as code.

### REQ-REC-006 — Architecture and Replaceability

The Console SHALL preserve JuanerAI dependency direction and least capability.

- **AC-REC-006-01:** Experience calls Application only. Application invokes the business-oriented read-only `RunEvidenceReader` Port, receives admitted local observations in business or standard-platform values, and passes them to pure Product Core for Artifact admission/projection. Product Core owns pure admission, status projection, reference/integrity interpretation, and reader result validation; it neither imports nor depends on the Port. The local filesystem implementation is an Adapter and the Personal Console Profile alone composes it.
- **AC-REC-006-02:** Product Core, Application, Port, Profile, and Experience expose no filesystem-handle, path-library, SDK, writer-Port, runtime-vendor-specific, or provider-specific type. The new Core may import only the existing pure `createLocalAnalysisDomain()` validator surface; it does not import the new Port. Current local-analysis writer paths and `RunArtifactStore` are neither imported nor changed. The Profile selects the local reader Adapter; Application does not branch on Runtime vendor/name.
- **AC-REC-006-03:** One unchanged `RunEvidenceReader` Port contract suite SHALL run against a deterministic Test double and the local Adapter, proving Application receives only admitted local observations and Core remains Port-independent as well as read-only/failure behavior.

### REQ-REC-007 — Loopback Host, Activation, Rollback, and Retirement

The capability SHALL be activated only as a separate personal read-only composition with closed evidence gates.

- **AC-REC-007-01:** After one valid explicit selection yields a frozen reader result, the Node standard-library host binds only to `127.0.0.1` on port `0`, prints its resulting `http://127.0.0.1:<assigned-port>/` URL, and serves only `GET /` as `text/html; charset=utf-8`. It does not open a browser; all other methods/paths return `404`; Ctrl+C closes the host without Artifact mutation.
- **AC-REC-007-02:** The HTML at `GET /` visibly renders the status, applicable integrity outcomes, and only the status-authorized data from REQ-REC-003. Each admitted human-readable asset is rendered as labelled escaped inert text inside `<pre>`; no Buffer/Uint8Array numeric array or executable content is rendered. A rejected selection/read starts no host and writes a sanitized error to stderr with nonzero exit. The host exposes no API, control, hyperlink, form, or script that selects/browses/scans/switches another directory or changes an Artifact.
- **AC-REC-007-03:** Before activation, Test-owned unit, Port-contract, integration, loopback-host E2E, negative-side-effect, typecheck/no-emit, focused regression, canonical offline validation, Test Asset Retirement, and independent validation evidence are recorded against these ACs. The exact REC-CONTRACT-002 inventory, and only it, is appended to `tsconfig.json` at the authorized Test/implementation step.
- **AC-REC-007-04:** Rollback or retirement disables/removes only the Console composition/entry surface after validation and removes the same approved Console entries from the explicit TypeScript graph only together with the retired Console paths under an approved retirement Change. It preserves every selected Run's bytes and does not alter producer contracts, CLI, current Profile, Runtime, or artifacts.
- **AC-REC-007-05:** No read support for Artifact versions other than exact `1.0`, migration, repair, fallback, automatic upgrade, alternate host, non-loopback bind, or automatic browser opening is offered.

## Explicitly Unavailable

This capability provides no Run list, scan, search, source-row inspection, Artifact change, execution, Decision Loop transition, or enterprise behavior. Its direct local-path input is not a sandbox or authorization boundary. The personal trusted-local profile makes no hostile-resource-exhaustion guarantee; any maximum Artifact/file-size policy requires a separate explicit product/contract decision. Concurrent external modification is outside this personal read-only scope; observable instability fails closed and this Change creates no locking, recovery, retry, or streaming protocol.
