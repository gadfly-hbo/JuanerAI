# Xanthil Desktop Physical Structure Decision

## Decision status

- Decision ID: XDESK-STRUCT-001
- Status: APPROVED_AND_MAPPED
- Authority: XDESK-DECISION-001 v1.0 items 3 through 9 and 12
- Structure skill result: the approved sixteen-group ledger is complete enough
  to map; this document adds physical names and constraints only
- Schema: greenfield Desktop 1.0; no migration or downgrade

Technical Decision Amendment 001 and the coordinator decision authorize the
minimum additive Desktop Run 3.0 mapping in this document. It uses existing
approved Desktop Core/Port/adapter paths and the existing physical Run root;
it does not revise the approved sixteen-group business ledger. The complete
Change authoring is `SPEC_AUTHOR_COMPLETE_INTERRUPTED_RESUMPTION_001`; independent
whole-package review and the affected Spec Gate remain pending, and downstream
Gates remain locked. The SQLite/file/Run structure below is unchanged.
Intermediate builds always create this complete schema and may only admit the
exact record subsets below; no temporary DDL, identity, relationship, file
protocol, or Run 3.0 variation is approved.

## Incremental record-admission contract

Every build reads all sixteen tables, their constrained columns, references,
states, form kinds and receipts before deciding that an existing Project is
supported. “Empty” below means the table was actually queried and contains no
row; it is not an omitted query or projected default. A row that does not fit
the exact tuple refuses the whole Project as existing public `FORBIDDEN` before
any business-write connection or semantic reconciliation. It is not omitted,
marked corrupt, default-filled, migrated, deleted, adopted, or rewritten.

| Admission tuple | Supported committed state | Required-empty/later state | Allowed receipt kinds and references |
|---|---|---|---|
| A1.1 / M1.1 | no Project is opened; no database capability enters Main | all persisted state is unreachable | no receipt or reference operation |
| A1.2 / M1.2 | one initialized `projects` row, zero `product_sessions`; all sixteen tables and constraints exist | every Session/business child table empty | `initialize_project` only; Project result and all owner/current references null |
| A1.3 / M1.3 | A1.2 plus zero or more professional Sessions, one Case each, exactly sequence-1 `Draft` current revision, initial case fields and `ok|integrity_blocked` | confirmations, snapshots, aggregates, Runs, disclosures, Attempts, Drafts, Findings, acceptances, decision forms, closures, reports empty; all their revision references null | A1.2 plus `create_session`, `mark_integrity_blocked`; session current revision set, revision previous/snapshot/confirmation/finding/acceptance/closure/report references null |
| A1 / M1.4–I1 | A1.3 plus edited case fields and positive decimal row versions | same later tables/references empty; no Ready/Review/NeedsAttention/Completed revision | A1.3 plus `save_form` only where result is `case_revision`; no decision-form receipt |
| A2 / I2 | A1 plus Draft/Ready/Review/NeedsAttention revisions, prior Draft revisions, confirmation/snapshot, aggregate, analysis Run, Finding and draft report rows allowed by the final lifecycle | model disclosures, Attempts, assistance Drafts, Finding acceptances, decision forms, closures empty; Completed unsupported; current acceptance/closure null | A1 plus `create_draft_revision`, `confirm_revision`, `start_analysis`, `cancel_analysis`, `settle_analysis`, `reconcile_interrupted`; current snapshot/confirmation/finding/report and previous-revision references only when their final guards hold |
| A3 / I3 | A2 plus Finding acceptances, evidence explanation, decision forms, closures, final report versions, export receipts and Completed | model disclosures, Attempts and assistance Drafts empty | A2 plus `accept_finding`, `complete_case`, `export_report`; `save_form` may return `case_revision` for case/evidence fields or `decision_form` for closure fields; all final current references allowed except assistance references |
| A4 / I4/final | every final valid sixteen-table row/state/reference, including disclosures, Attempts and assistance Drafts | nothing beyond the final schema/contract | every exhaustive final operation/result kind in `command_receipts` |

All tuples accept `mark_integrity_blocked` when and only when the original
integrity rule applies. A2–A4 accept `reconcile_interrupted` only for a target
kind supported by that tuple: A2/A3 only `analysis_run`; A4 also
`assistance_attempt`. A later build opens an earlier tuple without migration,
new receipt, default filling, ID change, or schema-version advance. An earlier
build presented with later valid data performs the refusal above; downgrade is
never destructive.

Admission ordering is exact:

1. Resolve and contain the selected Project and sidecars.
2. Inspect raw SQLite header, application ID, user version, journal mode and
   foreign WAL/-shm conditions without opening a business-write connection.
3. Only for the already authorized exact XDK1 DELETE hot journal, allow native
   SQLite rollback; record this as physical recovery, not “zero write”.
4. Repeat the same read-only schema and integrity preflight after rollback.
5. Read all sixteen table/record/state/form/receipt/reference predicates for
   the current tuple.
6. On unsupported data, close read handles and return the private admission
   refusal with original bytes preserved; do not reconcile.
7. Only on admission may the normal single writer open and perform the tuple's
   final business writes.

Malformed/foreign/newer schema, disallowed WAL/-shm and containment failures
retain the original zero-write rule and public error meaning. The hot-journal
exception does not authorize a custom parser, backup, scan outside the selected
Project, or repair of semantic records.

The prior recommendation for multi-file operational records is historical and
is preserved in the frozen drafts-before-spec-002 evidence. The current
decision is node:sqlite operational state plus immutable files.

## Store and path contract

The Project is the directory selected through the native Main process. Absolute
Project paths never cross Main/Adapter boundaries.

    <project>/.xanthil/desktop/state.sqlite
    <project>/.xanthil/desktop/staging/<operation-id>/
    <project>/<session-id>/010_draw/
    <project>/<session-id>/020_clean/
    <project>/<session-id>/060_reports/
    <project>/.xanthil/runs/<run_id>/

The Session ID is the path component; display names never participate in paths.
The immutable artifact layouts are:

    010_draw/<snapshot-id>/members.csv
    010_draw/<snapshot-id>/orders.csv
    020_clean/<artifact-id>/aggregate.json
    060_reports/<report-id>/report.md
    060_reports/<report-id>/report.html

Every locator stored in SQLite is Project-relative, uses slash separators, and
must resolve beneath the owning Project without traversal, symlink escape, or
absolute components. Existing 1.0/2.0 Run locators retain their current
contract and consumers. Desktop `analysis_runs.run_locator` may reference only
a verified terminal Desktop 3.0 directory with the exact
`.xanthil/runs/<run_id>` spelling.

## Database runtime

Only adapters/storage-local/xanthil-desktop-decision-case.ts imports
node:sqlite. It uses DatabaseSync, parameterized prepared statements,
transactions, and close. The database `application_id` is exactly decimal
1480870705 (`0x58444B31`, XDK1) and `user_version` is exactly 100.

An absent database may be created only after the selected Project parent and
target path pass containment, no-symlink, and write checks. Creation sets the
application ID, creates the exact schema, sets user version, and commits as one
initialization before business use.

Before constructing SQLite for an existing path, the Adapter opens the exact
regular, non-symlink file with an OS read-only descriptor and reads the fixed
100-byte header. It requires `SQLite format 3\0`, rollback-journal read/write
format bytes 18/19 both equal to 1, big-endian user_version 100 at offset 60,
and big-endian application_id 1480870705 at offset 68. A short/malformed,
wrong-identity/version, WAL-format, `-wal`, or `-shm` input is rejected before
`DatabaseSync`; no SQLite sidecar/recovery/open occurs and bytes/directory
entries remain identical.

For a recognized rollback-format header with no `-journal`, the Adapter uses
`new DatabaseSync(path,{readOnly:true})`, never retries without the flag, and
performs only exact sqlite_schema/table/index/FK shape and `integrity_check`
inspection. It executes no journal-mode change, VACUUM, checkpoint, DDL, DML,
attachment, or writable temporary/persistent PRAGMA. Missing/extra schema or
failed integrity closes the connection and leaves database bytes/directory
entries identical.

One narrow native crash-recovery branch preserves the approved product reopen
behavior: when that exact recognized product header is present, no WAL/SHM
exists, and only the exact sibling `state.sqlite-journal` is a regular
non-symlink file, the Adapter classifies it as a trusted product rollback-
journal candidate. Under the Personal Profile's same-user, non-adversarial,
single-application-writer boundary, it may open write-capable solely to let
SQLite perform its native rollback-journal recovery, with no PRAGMA/DDL/DML or
custom journal parsing/copy/repair. It closes immediately, then runs the full
read-only schema/integrity preflight above. Native recovery may restore database
pages and remove the product journal; those recovery writes are permitted and
recorded distinctly. Failure becomes `INTEGRITY_BLOCKED`; there is no fallback,
manual recovery, or adoption. A foreign file that merely spoofs the XDK1 header
is outside this trusted-local recovery claim.

Malformed/identity/version/WAL/schema failures map to public
`SCHEMA_UNSUPPORTED`; a recognized product database whose integrity/recovery
fails maps to `INTEGRITY_BLOCKED`. Neither returns a Project projection.

Only a database that passed ordinary preflight or the native-recovery-then-
preflight branch is reopened for business writes. The Adapter records parent-
directory and file dev/inode/size/mtime plus the sidecar set before and after
read-only inspection, closes it, and repeats containment/header/version/schema-
digest/integrity checks immediately before write use. Observable drift aborts
with `SCHEMA_UNSUPPORTED` before a business write or persistent PRAGMA. This is
a trusted single-user/single-Application-writer contract, not protection from
an adversarial external process racing the same selected directory; no system
lock service or universal filesystem transaction is claimed. It then enforces:

- foreign_keys ON;
- journal_mode DELETE;
- synchronous FULL;
- busy_timeout 0;
- extension loading disabled;
- no user-provided SQL;
- one Electron application instance and one Application semantic writer.

Every write transaction starts with BEGIN IMMEDIATE. Busy/locked admission is
rejected immediately with STORE_BUSY; it is not queued or retried.
No database transaction stays open while reading source files, running DuckDB
or Python, or calling a provider.

Business transactions start only after this sequence. No migration, repair,
downgrade, default filling, table adoption, or deletion occurs. Unknown/
foreign diagnosis uses no write-capable fallback; the one write-capable open
before full schema inspection is solely the recognized product hot-journal
branch above.

## Common physical conventions

- Application generates every persisted row and operation ID except `run_id`
  with native `crypto.randomUUID()`, serialized as canonical lowercase
  hyphenated UUIDv4. IPC callers generate command_id, and Renderer generates
  manually authored candidate_id, with the same native UUIDv4 form;
  Application validates them and rejects collision; Application generates
  internal settle/reconcile command IDs. Desktop `run_id` is a canonical lowercase
  hyphenated UUIDv7 generated privately in the Desktop Application to retain
  the existing Run-root convention. Display names, paths, Pi IDs, and hashes
  are never entity IDs. No custom identifier encoder is introduced.
- Text is UTF-8. Empty string is allowed only for an explicitly user-editable
  Draft text field; it never represents unknown. Unknown or not-yet-produced is
  SQL NULL. A known empty collection is canonical JSON [].
- All product timestamps are Application-supplied UTC RFC3339 strings with
  millisecond precision and a Z suffix. Business dates are YYYY-MM-DD in
  Asia/Shanghai. SQLite does not manufacture timestamps.
- Money is nonnegative integer fen. Counts and byte lengths are nonnegative
  signed-64-bit SQLite INTEGER. Revision/report/form sequence numbers are
  positive INTEGER. The adapter binds and reads exact values as JavaScript
  `bigint` (including statement integer-safe mode); it never accepts a rounded
  `number` for an integer contract field.
- Booleans are INTEGER constrained to 0 or 1.
- SHA-256 is lowercase 64-character hexadecimal over exact bytes.
- Canonical JSON is UTF-8 JSON with object keys sorted by Unicode code point,
  arrays kept in business order, no insignificant whitespace, no duplicate
  keys, and no JSON numeric values for contract integers. A nonnegative integer
  is the string `"0"` or `[1-9][0-9]*` in the range 0 through
  9223372036854775807. A signed delta is `"0"` or `-?[1-9][0-9]*` in the range
  -9223372036854775808 through 9223372036854775807. A rational is exactly
  `{numerator:<signed-decimal-string>, denominator:<positive-decimal-string>}`,
  reduced by gcd, with positive denominator and zero normalized to `0/1`.
  Money fen, counts, byte lengths, metrics, IPC values, payloads, aggregate
  files, and Run evidence use these strings. The same serializer produces
  disclosure payload bytes and their hash.
- Every parse, cast, multiplication, subtotal, total, subtraction, absolute or
  relative-change numerator, group contribution, and reconciliation is checked
  before persistence. A signed-64-bit overflow is `CALCULATION_FAILED`; it
  produces no aggregate, terminal-success manifest, Finding, or report.
- Every SQLite Desktop record uses `schema_version` TEXT NOT NULL constrained
  to `1.0`. The separate Desktop Run manifest uses `schema_version: "3.0"`.
  Existing Run Artifact 1.0/2.0 schemas and consumers are unchanged.
- Every declared primary identity column is `TEXT NOT NULL PRIMARY KEY` even
  where SQLite would otherwise permit NULL for a non-INTEGER primary key.
- Final records are append-only. A Running Run or Attempt may make exactly one
  terminal transition. Current revision projections and current form Drafts may
  change only through the transitions in this Change.
- No foreign key cascades. Delete and update actions are RESTRICT. The product
  exposes no delete/retention UI.

Every child table uses the exact ordered composite owner tuple declared below.
Each referenced tuple has a matching PRIMARY KEY or UNIQUE constraint in the
same order. Cross-Project, cross-Session, cross-Case, and cross-revision
references are rejected by SQLite and revalidated by Application before a
write. SQL CHECK/FK/UNIQUE constraints prove only row shape, ownership, and
identity; lifecycle/status/sequence predicates that require another row are
Application checks repeated inside the named `BEGIN IMMEDIATE` transaction.

## Exact sixteen-table mapping

The database contains exactly the following sixteen business tables. SQLite
internal tables and rollback-journal files are not business groups.

### 1. projects

Columns:

- project_id TEXT not null primary key;
- display_name TEXT not null;
- created_at TEXT not null;
- schema_version TEXT not null, exactly 1.0.

One row represents the currently selected product Project. The Project path is
not stored in the database. A non-product database is never claimed.

### 2. product_sessions

Columns:

- session_id TEXT not null primary key;
- project_id TEXT not null, foreign key to projects;
- display_name TEXT not null;
- mode TEXT not null, exactly professional;
- case_id TEXT not null;
- current_revision_id TEXT not null;
- created_at TEXT not null;
- schema_version TEXT not null.

Constraints:

- unique(project_id, case_id);
- unique(session_id, case_id);
- deferred composite foreign key from current_revision_id/session_id/case_id to
  case_revisions;
- one Session therefore owns exactly one Case identity and one current
  revision; there is no Session revision.

### 3. case_revisions

Columns:

- revision_id TEXT not null primary key;
- project_id, session_id, case_id TEXT not null;
- revision_sequence INTEGER not null and greater than zero;
- state TEXT not null, one of Draft, Ready, Review, NeedsAttention, Completed,
  default Draft;
- case_name TEXT not null;
- question_text TEXT not null;
- hypothesis_display_title TEXT not null;
- business_context TEXT not null, default empty string;
- alternative_explanations_json TEXT not null, default canonical `[]`;
- evidence_explanation_text TEXT not null, default empty string;
- previous_revision_id TEXT null;
- snapshot_id TEXT null;
- confirmation_id TEXT null;
- current_finding_id TEXT null;
- current_acceptance_id TEXT null;
- current_closure_id TEXT null;
- current_report_id TEXT null;
- integrity_state TEXT not null, one of ok, integrity_blocked, default ok;
- created_at and updated_at TEXT not null;
- row_version INTEGER not null and greater than zero, default 1;
- schema_version TEXT not null.

Constraints:

- unique(project_id, session_id, case_id, revision_sequence);
- unique(project_id, session_id, case_id, revision_id);
- a row-local CHECK makes previous_revision_id null exactly for sequence 1;
  otherwise its composite FK references a prior revision in the same Case, and
  Application proves it is exactly sequence minus one in the write transaction;
- every nullable current/source reference uses a same-owner composite FK;
- sequence 1 starts Draft with all nullable references null.

row_version is only optimistic concurrency metadata, not a business revision
axis. After Ready, changing a computation-affecting input creates the next
Draft revision rather than changing the confirmed revision.

`question_text`, `hypothesis_display_title`, `business_context`, and
`alternative_explanations_json` are the manually editable/assistance-adoptable
Case-form fields. `alternative_explanations_json` is a canonical array of
non-empty user strings with order preserved. `evidence_explanation_text` is a
manual or assistance-adoptable Review-form explanation; it never replaces the
immutable Finding metrics/refutation/limitations. Empty text means the user has
not supplied optional content, not unknown. `saveForm(case_fields)` updates the
first four fields only in Draft/Ready; `saveForm(evidence_explanation)` updates
only the explanation in Review. Both increment row_version and survive reopen.
Completed revisions reject either edit. Creating a new Draft revision copies
these user fields as editable starting values but creates no new computation
authority until confirmation.

`case_name` is always non-empty. Draft may temporarily hold an empty question;
confirmation/Ready requires non-empty `question_text` and
`hypothesis_display_title`. Whitespace is preserved in user text, but a value
containing only Unicode whitespace does not satisfy non-empty validation.

### 4. input_confirmations

Columns:

- confirmation_id TEXT not null primary key;
- project_id, session_id, case_id, revision_id, snapshot_id TEXT not null;
- member_id_column, member_group_column, order_id_column,
  order_member_id_column, paid_at_column, amount_column, status_column,
  currency_column TEXT; all except member_group_column are not null;
- comparison_start_date, comparison_end_date, current_start_date,
  current_end_date TEXT not null;
- currency TEXT not null, exactly CNY;
- time_zone TEXT not null, exactly Asia/Shanghai;
- valid_statuses_json and issue_treatments_json TEXT not null;
- selected_group_mode TEXT not null, one of none or mapped;
- hypothesis_id TEXT not null, exactly
  current_repurchase_rate_lower_than_comparison;
- method_id TEXT not null, exactly membership_repurchase_comparison;
- method_version TEXT not null, exactly 1.0;
- authority_confirmed_at, issues_confirmed_at, plan_confirmed_at TEXT not null;
- contract_json, contract_sha256, binding_json, binding_sha256, ir_json,
  ir_sha256 TEXT not null;
- created_at and schema_version TEXT not null.

Constraints:

- unique(revision_id);
- member_group_column is NULL exactly when selected_group_mode is none;
- both periods are non-overlapping [start,end) local-date intervals of equal
  positive calendar-day length;
- canonical valid_statuses_json is a non-empty unique string array;
- canonical issue_treatments_json contains each displayed reviewable issue
  class, affected count, and the accepted include/exclude/tie-break treatment.

contract_json contains only the row's IDs, currency/time zone, periods, status
selection, issue treatment, group mode, hypothesis, and method. binding_json
contains only the eight named column bindings, with member group null when
unused. ir_json contains the fixed five steps: verify immutable snapshot,
DuckDB primary calculation, Python independent recomputation, equality check,
and evidence/Finding assembly. Their stored SHA-256 values address those exact
canonical bytes; they are not separate entities or a new schema registry.

### 5. source_snapshots

Columns:

- snapshot_id TEXT not null primary key;
- project_id, session_id, case_id, revision_id TEXT not null;
- members_locator, members_display_name, members_sha256 TEXT not null;
- members_byte_length INTEGER not null and nonnegative;
- members_read_at TEXT not null;
- orders_locator, orders_display_name, orders_sha256 TEXT not null;
- orders_byte_length INTEGER not null and nonnegative;
- orders_read_at TEXT not null;
- included_member_count, excluded_member_count, included_order_count,
  excluded_order_count INTEGER not null and nonnegative;
- treatment_basis_json TEXT not null;
- confirmed_at, created_at, schema_version TEXT not null.

Constraints:

- unique(revision_id);
- both locators belong to the same snapshot directory and must exist together;
- treatment_basis_json is the canonical mapping from each exclusion/reviewable
  class to its count and confirmed treatment;
- a repeated explicit import receives a new snapshot ID even when hashes match.

The two stored files are byte-for-byte copies of the confirmed selected files.
Their original external paths are never persisted.

### 6. aggregate_artifacts

Columns:

- artifact_id TEXT not null primary key;
- project_id, session_id, case_id, revision_id, snapshot_id, run_id TEXT not
  null;
- method_id, method_version, code_identity TEXT not null;
- columns_json and measurement_meanings_json TEXT not null;
- group_pseudonym_map_json TEXT null;
- locator, sha256 TEXT not null;
- byte_length INTEGER not null and nonnegative;
- created_at and schema_version TEXT not null.

Constraints:

- unique(run_id);
- at transaction commit the owning Run is Succeeded before any Finding/current
  reference exposes the artifact; the artifact row is inserted while that Run
  is still Running, then the same terminal-success transaction updates the Run;
- group_pseudonym_map_json is NULL when group mode is none and otherwise maps
  local original values to revision-local pseudonyms; original values never
  appear in aggregate.json or provider payloads.

aggregate.json is canonical JSON containing identity/provenance; comparison and
current Active Member, Repeat Member, Repurchase Rate rational, and Repeat
Revenue fen; absolute/applicable relative changes; and either
group_contributions or the exact M2 value not_applicable. Group deltas must sum
exactly to total Repeat Revenue change.

### 7. analysis_runs

Columns:

- run_id TEXT not null primary key;
- project_id, session_id, case_id, revision_id, confirmation_id TEXT not null;
- profile_id, method_id, method_version, code_identity TEXT not null;
- run_contract_version TEXT not null, exactly 3.0;
- status TEXT not null, one of Running, Succeeded, Failed, Cancelled;
- started_at TEXT not null;
- deadline_at TEXT not null;
- ended_at, terminal_reason, run_locator, aggregate_id TEXT null;
- schema_version TEXT not null.

Constraints:

- partial unique index on revision_id where status is Running;
- Running requires `ended_at`, `terminal_reason`, `run_locator`, and
  `aggregate_id` null;
- Succeeded requires ended_at, run_locator, and aggregate_id and requires
  terminal_reason null;
- Failed requires ended_at and one of source_changed, toolchain_unavailable,
  calculation_failed, validation_mismatch, run_artifact_failed,
  publication_failed, deadline_exceeded, interrupted, integrity_blocked;
- Cancelled requires ended_at and terminal_reason user_cancelled.

The row is intended to index, but never duplicate, the separate Run evidence
ledger. A Succeeded row may be committed only after the exact locator resolves
to a verified immutable terminal 3.0 bundle whose run/owner/method/source/
artifact identities match the row and referenced SQLite records. Failed and
Cancelled rows keep `run_locator` and `aggregate_id` NULL. A published but
unreferenced Run directory is inert and is never scanned or adopted.

#### Desktop Run Artifact 3.0

The contract is owned only by the Desktop Product Core and
`DesktopRunEvidenceStore`. `run.json` is closed: unknown, duplicate, missing,
wrongly typed, out-of-order source/artifact, absolute/traversing path, unsafe
integer, or unsupported-version data is rejected. Its exact top-level fields
are:

- `schema_version`, exactly `"3.0"`;
- `run_id`, the directory's canonical UUIDv7;
- `analysis_kind`, exactly `"membership_repurchase_decision_case"`;
- `status`, one of `in_progress`, `succeeded`, `failed`, `cancelled`;
- `started_at`, and terminal-only `ended_at`, using the common timestamp form;
- `product_context`, exactly `project_id`, `session_id`, `case_id`,
  `revision_id`, `confirmation_id`, and `snapshot_id`;
- `application`, exactly `{id:"xanthil-desktop", version:"0.1.0"}`; this is
  local build/package identity and is not a public-release claim;
- `profile`, exactly `{id:"personal-desktop"}`;
- `execution`, exactly
  `{kind:"deterministic_local", model_usage:"none"}`;
- `method`, exactly `id:"membership_repurchase_comparison"`, version `"1.0"`,
  and `code_identity`;
- `tools`, exactly DuckDB version `"1.5.2"` and the verified actual Python
  version, which must be at least 3.9;
- `confirmation`, with exact `contract`, `binding`, and `ir` descriptors;
- `sources`, the exact two source descriptors below in fixed order;
- `artifacts`, the exact allowed descriptors below in fixed order;
- success-only `evidence` descriptor; and
- failure/cancellation-only `terminal_detail`, exactly `{reason:<reason>}`.

Provider, model, Runtime, Adapter, Pi session/event/tool, prompt, transcript,
external source path, credential, environment, and arbitrary metadata fields
are prohibited. `code_identity` is the SHA-256 of canonical JSON containing
exactly `method_id`, `method_version`, `primary_sql_sha256`, and
`python_verifier_sha256`.

Every file descriptor is exactly `{path, sha256, byte_length}` with
Project-relative or Run-relative path as specified and decimal-string
`byte_length`. Each confirmation descriptor has one fixed path:

| Confirmation key | Run-relative path |
|---|---|
| contract | `analysis-contract.json` |
| binding | `binding.json` |
| ir | `ir.json` |

`sources` is exactly:

1. `{role:"members", snapshot_id, path, display_name, sha256, byte_length,
   confirmed_at}` for
   `<session-id>/010_draw/<snapshot-id>/members.csv`;
2. `{role:"orders", snapshot_id, path, display_name, sha256, byte_length,
   confirmed_at}` for
   `<session-id>/010_draw/<snapshot-id>/orders.csv`.

Both source descriptors must match the one committed snapshot and
confirmation. Their external selection paths never enter the bundle.

`artifacts` permits only these entries and this order:

| Artifact ID | Kind | Run-relative path | Availability |
|---|---|---|---|
| `primary-query` | `query` | `assets/primary.sql` | initial |
| `independent-verifier` | `verifier` | `assets/verify.py` | initial |
| `duckdb-result` | `calculation_output` | `outputs/duckdb.json` | after DuckDB success |
| `python-result` | `verification_output` | `outputs/python.json` | after Python success |
| `run-summary` | `summary` | `summary.md` | success only |
| `run-evidence` | `evidence_document` | `evidence.md` | success only |

Each artifact descriptor is exactly `{artifact_id, kind, path, sha256,
byte_length}`. `evidence` points to `evidence.json` and has the ordinary file
descriptor shape. That canonical file uses schema `3.0` and contains exactly
the run/context/method/code identities, both source hashes, descriptors for the
two calculation outputs and candidate aggregate/report bytes, exact equality outcome,
M1 judgment, M2 applicability, and limitations. It repeats no raw rows,
original group values, paths outside the Project, or provider/model data.

The two calculation output files share one closed wrapper:

- `schema_version`, exactly `"1.0"`;
- `run_id`;
- `implementation`, respectively `"duckdb_primary"` or
  `"python_independent"`;
- `method`, the exact manifest method object; and
- `result`, the closed value below.

`result` contains exactly:

- `periods.comparison` and `periods.current`, each with
  `active_member_count`, `repeat_member_count`, `repurchase_rate`, and
  `repeat_revenue_fen`;
- `changes.active_member_count`, `changes.repeat_member_count`, and
  `changes.repeat_revenue_fen`, each with signed `absolute_delta` and
  `relative_change` equal to a reduced rational or the string
  `"not_applicable"` when its comparison value is zero;
- `changes.repurchase_rate`, with rational `absolute_delta` and rational or
  `"not_applicable"` `relative_change` by the same zero rule; and
- `m2`, exactly `{status:"not_applicable"}` when group mode is none, otherwise
  `{status:"applicable", groups:[...]}`. Each group row contains only
  revision-local UUIDv4 `group_id`, comparison/current Repeat Revenue fen, and
  signed delta; rows sort by `group_id`, cover the union of groups present in
  either period, and deltas reconcile exactly to total Repeat Revenue change.

All integers/rationals use the common decimal-string forms. Application creates
one original-value-to-random-UUIDv4 group map per Run and gives the same closed
map to both implementations; only local `group_pseudonym_map_json` may retain
the original values. Equality compares canonical `result` bytes (the wrapper's
different `implementation` value is excluded) and requires the same SHA-256.
`aggregate.json` contains exactly schema/artifact/run/context/method identities
plus that agreed `result`; it contains neither implementation wrapper nor the
original-value map.

`evidence.json` contains exactly:

- `schema_version`, `run_id`, `product_context`, and `method` matching the
  manifest;
- `sources`, the two `{role, sha256}` values in manifest order;
- `calculations`, the two output descriptors;
- `equality`, exactly `{status:"matched", result_sha256}`;
- `judgment`, one of `Confirmed`, `Rejected`, `Inconclusive`;
- `m2_applicability`, exactly `applicable` or `not_applicable`;
- `candidate_publications.aggregate` with `artifact_id`, Project-relative
  locator, SHA-256, and decimal-string byte length;
- `candidate_publications.report` with `report_id` and separate Markdown/HTML
  Project-relative locator/SHA-256/decimal-string byte-length descriptors; and
- `limitations`, the fixed ordered codes `association_not_causation`,
  `no_significance_test`, and `confirmed_local_snapshot_only`.

The Markdown Run summary/evidence documents are deterministic human-readable
projections of these values, include the Run/context/method/source hashes,
judgment, exact metrics, evidence locators, and limitation labels, and add no
field, conclusion, raw row, original group value, or authority.

Lifecycle validation is exact:

- `in_progress` omits `ended_at`, `evidence`, and `terminal_detail`, and lists
  the two initial artifacts followed only by the actually durable ordered
  calculation-output prefix: no output, DuckDB only, or DuckDB then Python;
- `succeeded` has `ended_at` and `evidence`, omits `terminal_detail`, and has
  all six artifacts;
- `failed`/`cancelled` have `ended_at` and `terminal_detail`, omit `evidence`,
  and list the two initial artifacts followed only by the actually durable
  calculation-output prefix (neither success document is permitted); a failed
  bundle never asserts an adopted aggregate, Finding, or report;
- failed reasons are `source_changed`, `toolchain_unavailable`,
  `calculation_failed`, `validation_mismatch`, `run_artifact_failed`,
  `publication_failed`, `deadline_exceeded`, `interrupted`, or
  `integrity_blocked`; cancellation reason is only `user_cancelled`;
- a terminal manifest is immutable and terminal-success bytes are never
  rewritten into failure bytes.

The store first writes the three confirmation files, two source-independent
code assets, and in-progress `run.json` beneath a hidden unique staging
directory inside `.xanthil/runs`; it flushes files/directories and exclusively
renames the complete directory to `<run_id>`. Later named artifacts use sibling
temporary files, flush/fsync, and exclusive creation. Terminal `run.json` is
the sole overwrite exception: after verifying the expected in-progress bytes,
the store writes a sibling temporary manifest, flushes/fsyncs, and atomically
renames it over `run.json` exactly once as the last file publication. The
terminal bytes are then immutable; no artifact or terminal target is replaced.
Deadline/cancellation may leave a durable in-progress/partial directory when no
safe terminal write is admitted; such a directory has no SQLite locator and is
not resumed.

#### Run consumer/version matrix

| Consumer | Accepted version/lifecycle | Required 3.0 result |
|---|---|---|
| Existing `LocalRunArtifactStore` writer | creates 2.0 only | no 3.0 creation path |
| Existing `LocalRunArtifactStore.readTerminalRun` | terminal 1.0 and 2.0 | existing unsupported-version failure |
| Existing Console `createLocalRunEvidenceReader` | selected-directory terminal 1.0 only | `RUN_CONTRACT_UNSUPPORTED` |
| New `DesktopRunEvidenceStore` | Desktop 3.0 only, exact run ID | full closed validation |

Sharing `.xanthil/runs` creates no discovery contract. The Console reader is
still selected-directory and does not enumerate the root. The Desktop store
does not read 1.0/2.0. Existing artifacts are not migrated, backfilled,
rewritten, indexed, or deleted.

### 8. model_disclosures

Columns:

- disclosure_id TEXT not null primary key;
- project_id, session_id, case_id, revision_id TEXT not null;
- action_kind TEXT not null, one of organize_question, explain_evidence,
  draft_candidates;
- categories_json, aggregate_refs_json TEXT not null;
- payload_sha256 TEXT not null;
- requested_provider, requested_model TEXT not null;
- decision TEXT not null, one of accepted, refused;
- free_text_confirmed_at TEXT null;
- decided_at, created_at, schema_version TEXT not null.

Constraints:

- organize_question permits aggregate_refs_json equal to []; the other actions
  require the exact non-empty approved aggregate references;
- free_text_confirmed_at is required exactly when decision is accepted and
  user-authored free text is in categories_json; it is NULL for refusal or a
  payload with no free text;
- no payload bytes, raw input, provider response, credential, or transcript is
  stored in this table.

### 9. assistance_attempts

Columns:

- attempt_id TEXT not null primary key;
- disclosure_id TEXT not null and unique;
- project_id, session_id, case_id, revision_id TEXT not null;
- action_kind, profile_id, runtime_id, runtime_version, adapter_id,
  adapter_version, requested_provider, requested_model TEXT not null;
- actual_provider, actual_model, ended_at, terminal_reason, draft_id TEXT null;
- status TEXT not null, one of Running, Succeeded, Failed, Cancelled;
- started_at, deadline_at, schema_version TEXT not null.

Constraints:

- partial unique index on revision_id where status is Running;
- Running requires actual model and all terminal/output columns null;
- Succeeded requires actual provider/model, ended_at, and draft_id;
- Failed requires ended_at, null draft_id, and one of provider_failed,
  validation_failed, deadline_exceeded, interrupted;
  actual_provider/actual_model are either both null or both non-null and may be
  non-null only after a response identity was actually observed;
- Cancelled requires ended_at, terminal_reason user_cancelled, and null actual
  provider/model/draft fields;
- a disclosure with decision refused can never be referenced.

attempt_id is independent of run_id and any Pi session ID.

### 10. assistance_drafts

Columns:

- draft_id TEXT not null primary key;
- attempt_id TEXT not null and unique;
- project_id, session_id, case_id, revision_id TEXT not null;
- draft_kind TEXT not null, one of question_fields, evidence_explanation,
  candidates;
- generated_content_json TEXT not null;
- edited_content_json TEXT null;
- disposition TEXT not null, one of pending, adopted, rejected, default pending;
- target_form TEXT null, one of case_fields, evidence_explanation,
  decision_candidates;
- decided_at TEXT null;
- created_at and schema_version TEXT not null.

Constraints:

- generated_content_json is the normalized labeled Draft, never a raw provider
  response/transcript;
- pending requires all disposition fields null;
- adopted requires target_form and decided_at; rejected requires decided_at and
  target_form null;
- adoption may update only question/business-context/alternative-explanation,
  evidence-explanation, or candidate Draft fields.

The content schema is exact by `draft_kind`:

- `question_fields`: `{question_text, hypothesis_display_title,
  business_context, alternative_explanations}` and target `case_fields`;
- `evidence_explanation`: `{evidence_explanation_text}` and target
  `evidence_explanation`;
- `candidates`: `{candidates:[...]}` and target `decision_candidates`, where
  each persisted candidate has the exact decision-form candidate shape below.
  Runtime output omits candidate_id; Application validates it and assigns each
  UUIDv4 before generated_content_json is persisted.

`generated_content_json` and optional `edited_content_json` use that one closed
schema; unknown keys are rejected. Reject keeps target_form null. Adopt stores
the edited value when present, otherwise generated value, and updates only the
owning Case revision or current decision form in the same transaction as the
Draft disposition. Question adoption is allowed only while the action's source
revision is Draft/Ready, evidence explanation only in Review, and candidate
adoption only after Finding acceptance in Review. Candidate adoption updates
the undisposed current Draft form; when none exists it appends form_sequence 1
with disposition `draft`. It never marks a form saved or completes the Case.
Manual entry remains
available through `saveForm` without any Attempt or Draft.

### 11. findings

Columns:

- finding_id TEXT not null primary key;
- run_id TEXT not null and unique;
- project_id, session_id, case_id, revision_id, aggregate_id TEXT not null;
- judgment TEXT not null, one of Confirmed, Rejected, Inconclusive;
- metrics_json, supporting_evidence_json, refutation_json, limitations_json,
  evidence_refs_json TEXT not null;
- method_id, method_version TEXT not null;
- created_at and schema_version TEXT not null.

Only an agreeing Succeeded Run may create a Finding. Failure, cancellation,
deadline, interruption, or validation mismatch creates none.

### 12. finding_acceptances

Columns:

- acceptance_id TEXT not null primary key;
- finding_id TEXT not null and unique;
- project_id, session_id, case_id, revision_id TEXT not null;
- action TEXT not null, exactly accept;
- accepted_at and schema_version TEXT not null.

There is no default acceptance. Duplicate delivery of the same command returns
the same record through its command receipt.

### 13. decision_forms

Columns:

- form_id TEXT not null primary key;
- project_id, session_id, case_id, revision_id TEXT not null;
- form_sequence INTEGER not null and positive;
- candidates_json TEXT not null, default [];
- route TEXT null, one of candidate_comparison or insufficient_evidence;
- insufficient_reason, preferred_candidate_id, preferred_reason TEXT null;
- disposition TEXT not null, one of draft, saved, not_adopted, deferred,
  more_evidence, default draft;
- disposition_at and defer_until TEXT null;
- created_at, updated_at, schema_version TEXT not null.

Constraints:

- unique(revision_id, form_sequence);
- candidate_comparison requires at least two candidates; every candidate has
  evidence basis, risk/refutation, applicability, and future metric; zero or one
  preferred candidate is allowed and a preferred candidate requires a reason;
- insufficient_evidence requires non-empty insufficient_reason and no preferred
  candidate;
- route null is allowed only for a non-closure Draft/disposition;
- defer_until is nullable and allowed only with deferred.

The highest form_sequence is the current form; prior explicit dispositions are
retained. Editing an undisposed current Draft updates that row and row content
only; an explicit disposition or later resumed edit appends a new sequence.

`candidates_json` is a canonical ordered array. Each entry is exactly
`{candidate_id, title, evidence_basis, risk_or_refutation,
applicability_conditions, future_validation_metric}`. `candidate_id` is UUIDv4
and all five text fields are strings; a candidate is valid for saving the
candidate-comparison route only when all are non-empty. Manual add/edit/
duplicate/remove and adopted assistance content produce the same shape; a
new or duplicated manual candidate uses a Renderer-generated native UUIDv4
that does not collide within the revision's form history; Application assigns
UUIDv4 values to normalized assistance candidates. A duplicate therefore
receives a new ID. `preferred_candidate_id` is NULL or one ID in the
same array. Draft saves may be incomplete; route-valid `saved` rows must satisfy
all closure checks. `saveForm(decision_closure)` is the only manual writer and
uses expected row_version; it never accepts or completes the Finding.

### 14. decision_closures

Columns:

- closure_id TEXT not null primary key;
- project_id, session_id, case_id, revision_id, acceptance_id, form_id TEXT not
  null;
- route TEXT not null, one of candidate_comparison or insufficient_evidence;
- completed_at and schema_version TEXT not null.

Constraints:

- unique(acceptance_id);
- the referenced saved form and acceptance must belong to the same revision and
  satisfy the chosen route;
- a later accepted rerun may produce a new Closure while the earlier Closure is
  retained and the revision remains Completed.

### 15. report_versions

Columns:

- report_id TEXT not null primary key;
- project_id, session_id, case_id, revision_id, finding_id TEXT not null;
- acceptance_id and closure_id TEXT null;
- version_sequence INTEGER not null and positive;
- state TEXT not null, one of draft, final, superseded;
- markdown_locator, markdown_sha256 TEXT not null;
- markdown_byte_length INTEGER not null and nonnegative;
- html_locator, html_sha256 TEXT not null;
- html_byte_length INTEGER not null and nonnegative;
- source_json, evidence_refs_json TEXT not null;
- created_at and schema_version TEXT not null.

Constraints:

- unique(revision_id, version_sequence);
- final requires non-null acceptance_id and closure_id from the same revision;
- draft requires both null;
- superseded is a current projection label only; previously published bytes are
  never rewritten or deleted.

### 16. command_receipts

Columns:

- command_id TEXT not null primary key;
- operation_kind TEXT not null, one of initialize_project, create_session,
  create_draft_revision, save_form, confirm_revision, start_analysis,
  cancel_analysis, settle_analysis, record_model_disclosure,
  start_assistance, cancel_assistance, settle_assistance,
  dispose_assistance_draft, accept_finding, complete_case, export_report,
  mark_integrity_blocked, reconcile_interrupted;
- project_id TEXT not null;
- session_id, case_id, revision_id TEXT null as permitted by the operation;
- input_fingerprint TEXT not null;
- outcome TEXT not null, one of succeeded, rejected;
- result_kind TEXT null, one of project, product_session, case_revision,
  input_confirmation, analysis_run, model_disclosure, assistance_attempt,
  assistance_draft, finding_acceptance, decision_form, decision_closure,
  report_version;
- result_id, rejection_reason TEXT null;
- completed_at and schema_version TEXT not null.

Constraints:

- succeeded requires the operation-specific result_kind/result_id and a null
  rejection_reason;
- rejected requires a stable rejection_reason and null result fields;
- the receipt is inserted in the same transaction as its state transition;
- same command_id plus same fingerprint returns the recorded outcome; same ID
  plus different fingerprint is rejected as COMMAND_CONFLICT.

Receipts are not a general message bus, event journal, replay queue, or job
scheduler.

`input_fingerprint` is SHA-256 over canonical JSON containing exactly
`operation_kind` plus the closed normalized business request with command_id,
Application-generated row/operation IDs, and Application timestamps omitted.
For confirmation it includes the re-read source hashes plus confirmation; for
settlement it includes the admitted work ID and terminal result/descriptors;
for disclosure it includes payload hash/provider/model/decision; for export it
includes report ID and written-byte descriptor. Thus duplicate delivery with
the same command and business bytes is stable even when newly proposed server
IDs differ, while any business-input change conflicts.

The enum is exhaustive. Native chooser/inspection and pure reads create no
receipt. `initialize_project` covers first schema creation; user commands map
one-for-one to their names; `settle_analysis`/`settle_assistance` cover one
asynchronous terminal winner; `mark_integrity_blocked` and
`reconcile_interrupted` are bounded Application-generated commands with UUIDv4
IDs; and `export_report` records completion without persisting the destination
path. Report publication occurs inside `settle_analysis` or `complete_case` and
is not a separate command. No effecting command uses an unlisted kind.

Success result kinds map exactly: initialize_project→project;
create_session→product_session; create_draft_revision→case_revision;
save_form→case_revision for case/evidence fields or decision_form for closure
fields; confirm_revision→input_confirmation; start/cancel/settle_analysis→
analysis_run; record_model_disclosure→model_disclosure;
start/cancel/settle_assistance→assistance_attempt;
dispose_assistance_draft→assistance_draft;
accept_finding→finding_acceptance; complete_case→decision_closure;
export_report→report_version; mark_integrity_blocked→case_revision; and
reconcile_interrupted→analysis_run or assistance_attempt according to the
reconciled identity. Only initialize_project permits all owner suffixes NULL;
all other kinds store every owner identity available at admission, with
create_session filling the newly created full owner tuple in the same commit.

## Executable key and relationship contract

In addition to each primary key, the DDL declares these exact matching UNIQUE
parent keys (column order is normative):

- `product_sessions(project_id, session_id)` and
  `product_sessions(project_id, session_id, case_id)`;
- for every revision-owned table, `(project_id, session_id, case_id,
  revision_id, <that table's primary identity>)`;
- `case_revisions(project_id, session_id, case_id, revision_id)` and
  `case_revisions(project_id, session_id, case_id, revision_sequence)`.

The phrase “every revision-owned table” means input_confirmations,
source_snapshots, aggregate_artifacts, analysis_runs, model_disclosures,
assistance_attempts, assistance_drafts, findings, finding_acceptances,
decision_forms, decision_closures, and report_versions. The fifth column is
respectively confirmation_id, snapshot_id, artifact_id, run_id, disclosure_id,
attempt_id, draft_id, finding_id, acceptance_id, form_id, closure_id, or
report_id. No inferred/reordered key is valid.

The exact composite FKs are:

| Child columns | Parent columns | Timing |
|---|---|---|
| product_sessions(project_id) | projects(project_id) | immediate |
| product_sessions(project_id, session_id, case_id, current_revision_id) | case_revisions(project_id, session_id, case_id, revision_id) | DEFERRABLE INITIALLY DEFERRED for create-session cycle |
| case_revisions(project_id, session_id, case_id) | product_sessions(project_id, session_id, case_id) | DEFERRABLE INITIALLY DEFERRED for create-session cycle |
| case_revisions(project_id, session_id, case_id, previous_revision_id) | case_revisions(project_id, session_id, case_id, revision_id) | immediate when non-NULL |
| case_revisions owner + snapshot_id/confirmation_id/current_finding_id/current_acceptance_id/current_closure_id/current_report_id | matching same-owner table identity | immediate when non-NULL; child is inserted before pointer update |
| input_confirmations owner + snapshot_id | source_snapshots owner + snapshot_id | immediate |
| every other revision-owned row's four-column owner | case_revisions four-column owner | immediate |
| aggregate_artifacts owner + snapshot_id/run_id | source_snapshots owner + snapshot_id; analysis_runs owner + run_id | immediate |
| analysis_runs owner + confirmation_id/aggregate_id | input_confirmations owner + confirmation_id; aggregate_artifacts owner + artifact_id | immediate; aggregate nullable until terminal success |
| assistance_attempts owner + disclosure_id/draft_id | model_disclosures owner + disclosure_id; assistance_drafts owner + draft_id | immediate; draft nullable until success |
| assistance_drafts owner + attempt_id | assistance_attempts owner + attempt_id | immediate; draft inserted before Attempt pointer update |
| findings owner + run_id/aggregate_id | analysis_runs owner + run_id; aggregate_artifacts owner + artifact_id | immediate |
| finding_acceptances owner + finding_id | findings owner + finding_id | immediate |
| decision_closures owner + acceptance_id/form_id | finding_acceptances owner + acceptance_id; decision_forms owner + form_id | immediate |
| report_versions owner + finding_id/acceptance_id/closure_id | matching same-owner identity | immediate when nullable values are non-NULL |
| command_receipts project/session/case/revision owner prefix | projects, product_sessions, and case_revisions matching prefix | immediate; nullable suffixes are allowed only by operation kind |

Every FK is `ON UPDATE RESTRICT ON DELETE RESTRICT`. The two deferred FKs are
the only deferred constraints. Session creation inserts the Session and first
revision in one transaction and COMMIT proves the cycle. All later cyclic
current-output relationships use NULL-first, insert-child, update-parent order
inside one transaction; they do not require deferred constraints.

SQL enforces exact key ownership, null/status row-shape CHECKs, uniqueness, and
FK existence. Application rechecks inside `BEGIN IMMEDIATE` the predicates SQL
cannot express without triggers: previous revision is sequence minus one;
Session current revision is greatest committed sequence; the final transaction
state makes Run Succeeded before Finding/current aggregate adoption (the
aggregate child is inserted first to satisfy the immediate Run pointer FK);
Finding/acceptance/form/Closure/
report lifecycle matches current revision; Attempt/Draft/disclosure state is
eligible; and no Running Run/Attempt exists in the other table. No trigger is
introduced.

Contract tests must independently violate every UNIQUE/FK/CHECK, including a
composite child whose individual IDs exist under different owners; defer and
COMMIT the valid and invalid create-session cycle; attempt each missing or
out-of-order child update for revision/snapshot/confirmation, Run/aggregate,
Attempt/Draft, Finding/acceptance/form/Closure/report; and race each
Application-only predicate. They also enumerate every effecting operation kind
and reject an unlisted kind. Each case asserts SQL constraint failure or the
stable sanitized Application failure and no partial record/pointer/receipt.

## Relationship and current-reference contract

- Project 1:N Product Sessions.
- Product Session 1:1 Case identity.
- Case 1:N Case revisions.
- Revision N source/confirmation history only through new revisions; each
  revision has at most one confirmed snapshot/confirmation.
- Revision 1:N Runs, disclosures, Attempts, Drafts, Findings, acceptances,
  forms, Closures, and report versions according to their guards.
- Case revision current pointers are each null or one same-revision record.
  Historical records are not deleted when a pointer advances.
- Session current_revision_id points to the greatest committed revision
  sequence for that Case.
- Separate partial unique indexes enforce one Running Run and one Running
  Attempt per revision. Cross-table mutual exclusion is enforced inside one
  BEGIN IMMEDIATE Application admission transaction by checking both tables
  before either insert. The single-writer/single-instance contract is required;
  this is not a multi-writer guarantee.

Supporting indexes are limited to:

- product_sessions(project_id, created_at, session_id);
- case_revisions(session_id, case_id, revision_sequence);
- each table's primary and declared unique keys;
- the two partial Running indexes;
- report_versions(revision_id, version_sequence);
- decision_forms(revision_id, form_sequence).

No full-text, global search, cross-Project, telemetry, or analytics index is
created.

## File publication and database linearization

For every artifact-producing command:

1. Application validates Project, owner tuple, schema/version, state guard,
   command ID, input fingerprint, and containment before physical work.
2. The storage Adapter creates the complete unique content beneath
   .xanthil/desktop/staging/<operation-id>/ on the same filesystem.
3. It flushes every file, fsyncs each affected directory, calculates exact
   SHA-256 and byte length, and validates the complete shape.
4. It exclusively renames the unique directory to its final target. Existing
   targets are never replaced.
5. Application opens one BEGIN IMMEDIATE transaction, revalidates guards and
   command receipt, inserts immutable records, advances current projections,
   inserts the receipt, and commits.
6. Only a successful database commit makes the result visible and permits a
   success response.

Run success spans two independent durable stores without pretending to be one
transaction. Its physical publication order is:

1. the already committed Running row and start receipt exist;
2. verified 020_clean aggregate and draft-report candidates are published;
3. the Desktop Run store publishes outputs/evidence/docs and terminal
   `run.json` last;
4. the Application re-reads and verifies every referenced hash/length,
   rechecks the absolute deadline and accepted cancellation, and opens one
   `BEGIN IMMEDIATE` transaction only while success remains eligible;
5. that transaction marks the existing row Succeeded, sets
   `run_contract_version="3.0"`, `run_locator`, and `aggregate_id`, appends the
   Finding/draft report, advances same-revision pointers/state, and commits.

Step 3 is the physical evidence linearization point: the immutable terminal
bundle truthfully states that the deterministic calculation succeeded. Step 5
is the Application-visibility linearization point: until its commit, the Case,
Finding, report, and Run list do not expose or adopt that bundle. The two points
have distinct authority and no cross-store coordinator is implied.

If deadline or cancellation wins between steps 3 and 4, the success bundle
remains an unreferenced physical candidate and the Application commits only the
corresponding Failed/deadline_exceeded or Cancelled/user_cancelled SQLite
terminal state with NULL locator/aggregate. It does not rewrite the bundle.

Session creation uses the same protocol: the staging operation contains the
complete Session root with empty 010_draw, 020_clean, and 060_reports
directories; their final rename precedes one transaction that inserts Project
when needed, Session, first Draft revision, current reference, and receipt.

Failure rules are exact:

- before final rename: no business record; staging may remain isolated;
- after rename and before DB commit: orphan final bytes/directories may remain,
  but list/open/import/Run/report/provider code never scans, adopts, exposes, or
  consumes them;
- target collision: return the existing result only when the matching committed
  command receipt proves the same command and fingerprint; otherwise reject;
- COMMIT return exception or lost response: read the same receipt on a new
  connection; committed returns the same success, definitely absent returns
  failure, unreadable DB displays 结果待核对 and blocks resend;
- restart validates only committed rows and referenced bytes; it never scans,
  adopts, merges, rewrites, or deletes orphan content.

For Run success specifically:

- if the step-5 transaction definitively rolls back after terminal success is
  durable, the immutable terminal bundle remains an unreferenced physical
  candidate; the Application performs one bounded exceptional SQLite
  transition of the existing Running row to Failed/`publication_failed`, with
  NULL `run_locator`/`aggregate_id`, and moves an otherwise Ready revision to
  NeedsAttention;
- if step-5 COMMIT returns an unknown outcome, the Application opens a new
  connection and reads the exact run row/current references. A matching
  Succeeded row and verified locator returns the already committed success; a
  still-Running row is terminalized once as Failed/`publication_failed`; an
  unreadable database returns `RESULT_PENDING`, performs no write, and blocks
  resend until reopen resolves the same row;
- if the process crashes between steps 3 and 5, reopen sees only the committed
  Running row and terminalizes it once as Failed/`interrupted`, with no
  locator; it does not inspect, rewrite, fabricate failed Run evidence from,
  or adopt the terminal-success directory;
- no path rewrites terminal `run.json`, retries the same business command,
  constructs a second receipt, or exposes a physical candidate as product
  success. A user-requested retry is a new Run ID and command ID.

There is no background reconciler, recovery service, orphan collector, or
two-phase commit coordinator.

## Run, Assistance, cancellation, and recovery

- Analysis Run and Assistance Attempt absolute deadline: 300 seconds.
- DuckDB and Python per-call deadline: 30 seconds, capped by remaining outer
  time.
- Product automatic retry count: zero.
- First successful durable admission wins. Busy/conflict returns immediately.
- Duplicate start command returns the original admitted identity and never
  launches work again.
- Cancellation, deadline, external success, and failure compete for one
  terminal transition. Before any success publication Application rechecks the
  absolute deadline and accepted cancellation.
- After deadline no new tool call or Run/aggregate/report/Draft file publication
  starts. Issued subprocesses are terminated and bounded. A late result cannot
  create an aggregate, terminal manifest, Finding, report, or Assistance Draft.
  One bounded SQLite terminal transition to Failed/deadline_exceeded remains
  permitted; the Run directory may therefore remain in-progress/partial and
  unreferenced.
- On reopen, a committed Running Run or Attempt is updated once to
  Failed/interrupted with its corresponding failure projection and no adopted
  Run locator. No Pi session, provider request, subprocess, or Run is resumed,
  resent, scanned, or adopted.
- A first Run failure moves an otherwise Ready revision to NeedsAttention.
  Existing successful/accepted/Completed authority never downgrades.
- Assistance settlement never changes Case or Run state.
- An explicit retry has a new Run/Attempt identity; assistance retry also
  requires a new disclosure.

## Read and integrity behavior

Normal Session list/open starts from committed SQLite rows, validates owner
relationships, then verifies referenced file existence, containment, size, and
hash. It never infers a record from a directory.

Missing/damaged referenced bytes set the owning revision projection to
integrity_blocked through an explicit command transaction. Readable history
remains visible; operations depending on damaged authority are rejected. The
only product recovery is a new snapshot/new revision or an
INTEGRITY_BLOCKED-marked export that omits damaged bytes.

SQLite, Session snapshots, aggregates, reports, and Run Artifacts keep their
distinct authority roles. No read model may silently substitute one for
another.

## Rollback and retirement

Rollback disables Desktop composition/entry and preserves the database and all
files. Schema 1.0 is neither downgraded nor migrated. Current CLI Run stores
remain readable and writable under their unchanged contract. This Change adds
no delete, retention, archive, backup, migration, or orphan-adoption behavior.

## Root-configuration structural clarification

The first post-Gate return changes no business object, table, field, file
family, Run version, identity, lifecycle, or migration rule. It closes only the
test representation of two already-approved root configuration phases: exact
P4 and exact P5. `dependency-decision.md` is the sole value/ordering authority;
`path-contract.md` grants a one-file Test exception after refreshed Spec Gate.
Partial/mixed phases and unknown keys fail closed. This is a narrow use of the
existing Technical Decision Amendment 001 named-Change exception and does not
reopen the approved 13-category structure ledger.

## Structure-grill completeness record

Technical Decision Amendment 001 is the explicit named-Change exception that
delegates the remaining technical mapping; it does not replace the original
12-item user-approved business ledger. All thirteen structural categories are
closed as follows:

| Category | Closed decision |
|---|---|
| 1. Purpose/owner/scope | Desktop Decision Case owns operational state; immutable snapshots, aggregates, reports, and Run evidence retain distinct authority; non-goals are in proposal.md |
| 2. Objects | Exactly the sixteen mapped SQLite groups plus the four named immutable file families; no seventeenth table |
| 3. Grain | One row/file/bundle grain is stated per table and path; Run bundle is one execution |
| 4. Identity/deduplication | Native UUIDv4 Desktop IDs, UUIDv7 Run IDs, same-command receipts, new IDs for explicit retries/imports |
| 5. Fields/null/default/enums | Every table column and every 3.0 manifest field is named with null/default/allowed-value rules |
| 6. Relationships/deletion | Composite same-owner FKs, cardinalities, RESTRICT, no cascade or product delete |
| 7. Lifecycle/version/time | Revision, Run, Attempt, report, closure, manifest, deadline, terminal, and UTC/local-date rules are explicit |
| 8. Provenance/reconciliation | Source hashes, code/tool identity, independent output equality, group/total sum, receipt, and terminal bundle checks are exact |
| 9. Write/read/materialization | Application is semantic writer; named Ports write; committed-row reads never scan; reports/current pointers are projections |
| 10. Validation/index/audit | Closed validators, checked 64-bit arithmetic, containment, integrity checks, bounded indexes, immutable history, and receipts |
| 11. Migration/compatibility/rollback | Greenfield SQLite 1.0, additive Run 3.0, unchanged old consumers, no migration/adoption, composition rollback preserves bytes |
| 12. Cross-base alignment | No OntoBase/MemoryBase/KnowledgeBase joint contract; SQLite, files, and Run evidence align only through explicit owner IDs/hash locators |
| 13. Phase classification | Sixteen tables and four file families are mainline; receipts/staging are supporting; current pointers/reports are projections; Preview/enterprise extensions are later/non-goals |

No structural decision remains deferred for implementation. A required new
field, table, manifest key/version, source role, status, failure reason, read or
write entrypoint, path, migration, or cross-base mapping is contract drift and
returns to Spec/Controller review.
