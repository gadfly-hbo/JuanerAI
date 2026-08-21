# TASK-010 Validator FAIL Remediation R3

## Status

**CONTROLLER_SPEC_GATE_PASS_TASK010_VALIDATOR_REMEDIATION_R3.**
R3 supersedes rejected R1/R2. It preserves the approved product and durable
schema. Test is released only to establish causal RED; Worker, dependency,
credential, board, and external work remain locked.

## Objective, Scope, and Governance

R3 prevents physical/run-root/runtime failures from reaching Discovery, makes
the approved source-read provenance truthful, bounds permanent pending work,
and projects actual Pi state. It does not add fields, nullable values, run
statuses, cleanup, recovery, retry, source, tool, or model. No structure
decision is required: existing structure item 7 already owns required
non-null `sources[].read_at` as source read time.

## R3-REQ-001 — Closed preflight, order, and failures

Before Session creation, Discovery, Proposal, model/provider call, `beginRun`,
or Artifact write, Application calls exactly in order:

1. `RunArtifactStore.preflightRunRoot()` -> frozen `{ready:true}`;
2. `LocalAnalysisExecution.preflightApprovedFixture({source})` -> frozen
   `{source_id,kind,path,sha256,byte_size,fixture_version,read_at}`;
3. `AgentAnalysisRuntime.preflightModel({model})` -> frozen
   `{provider,model_id}`.

All requests are closed plain values; the specified results are the full result
shapes. The fixture call performs one local realpath-contained regular-file
identity/semantic byte read and observes RFC3339 `read_at`; it returns no
bytes/handle and makes no model egress. Application copies that `read_at`
unchanged into the required initial manifest before `beginRun`. After
confirmation, profile repeats physical identity validation before its
analytical read but returns only its existing profile shape and never changes
provenance.

Closed failure mapping is: missing fixture -> `FIXTURE_NOT_FOUND`; byte/SHA,
byte-size, CSV semantic, row/order/date/duplicate mismatch ->
`FIXTURE_MISMATCH`; path/realpath/regular-file containment failure ->
`SOURCE_BOUNDARY_VIOLATION`; unsafe run root -> `RUN_ROOT_UNSAFE`; unavailable
runtime -> `RUNTIME_UNAVAILABLE`; unavailable or nonmatching selected model ->
`MODEL_UNAVAILABLE`; unsupported contract/version ->
`CONTRACT_VERSION_UNSUPPORTED`. Post-confirm recheck mismatch maps
`SOURCE_CHANGED`. Each preflight failure has zero model call, Session, run, or
write.

Run-root validation exists both at storage construction and at per-start
preflight: construction rejects an invalid composition before capability
creation; per-start repeats it to close filesystem time-of-check/use change.
Neither creates a directory or writes.

## R3-REQ-002 — Scheduler and admission

Immediately after confirmation acceptance and before `beginRun`, Application
creates one attempt epoch/AbortController and calls its composition-owned
scheduler exactly once with frozen
`{at_epoch_ms: confirmation_clock_epoch_ms + 300000, callback}`.
`at_epoch_ms` is a finite safe-integer Unix epoch milliseconds value. Callback
is synchronous, zero-argument, and returns exactly `undefined`. `schedule`
returns frozen `{cancel}`; `cancel()` is zero-argument, idempotent, returns
`undefined`, and is called exactly once on every resolved attempt path. The
production Profile supplies an ordinary timer; tests use a private virtual
implementation through the identical dependency, not a product mode.

Expiry is the atomic winner over every not-yet-linearized publication unit: it
closes Application admission, aborts the one signal, requests Runtime abort
without awaiting a permanently pending Promise, selects logical `TIMEOUT`, and
starts no new Port/publication unit. Every Application continuation checks its
epoch before a call and after await; a late Promise result cannot regain
admission, write, or publish success.

User cancellation closes normal admission and requests Runtime cancellation but
does not initially abort the deadline signal. If Runtime settles before the
absolute deadline, one cancelled terminal may be admitted with its still-live
signal; otherwise expiry wins as `TIMEOUT` with no terminal write.

## R3-REQ-003 — Artifact linearization and deadline safety

`beginRun`, `commitConfirmedContract`, `appendAsset`, `replaceManifest`, and
`commitSuccess` all take the same attempt `cancellation_signal`. An already
aborted signal admits zero write. Once a deadline callback wins, no next
publication unit may start; Application never waits for a pending Port.

The Adapter's publication units are:

- `beginRun`: hidden staging, then the complete run directory plus initial
  `run.json` become visible together, or no run becomes visible.
- `commitConfirmedContract`, each `appendAsset`, and `replaceManifest`: the
  individual target file's final atomic publication is the unit.
- `commitSuccess`: `evidence.json`, `summary.md`, and `evidence.md` may each
  be fully published as candidate files before deadline. The final succeeded
  `run.json` atomic replacement is the sole success-publication linearization
  point.

If abort wins before a unit linearizes, that unit must not start/appear. If it
wins before `commitSuccess` final manifest publication, prior complete
candidate files may remain in the abandoned run directory but are unindexed by
the in-progress manifest; `readTerminalRun` and CLI never expose them as
success. Candidates add no schema, Artifact command, cleanup, repair, or
reader behavior. R3 makes no unverifiable claim that already-issued physical
I/O can never finish; deterministic pending Port doubles instead guarantee no
mutation, while Application proves no post-abort admission, no success
manifest/claim, and discarded late results.

## R3-REQ-004 — One cached Runtime/model and one observed Session

`preflightModel` creates/caches exactly one local-only R4 ModelRuntime/selected
model pair: `create({allowModelNetwork:false,refreshOnCreate:false})`, one
`refresh({allowNetwork:false})`, then `getModel`. It creates no AgentSession or
provider/model network call. Necessary local credential access is permitted but
never exposed/persisted. `openSession` creates exactly one AgentSession from
that cached pair; it creates no second runtime/model/fallback.

On that same Session, Execution synchronously calls `setActiveToolsByName`,
then reads `getActiveToolNames`; model provenance reads `session.model`. The
closed observed values must equal approved policy; requested values are never
echoed. Mismatch is the existing sanitized runtime/tool failure. Pi objects,
credentials, payloads, transcripts, and raw errors stay Adapter-private.

## AC, Tasks, Security, Activation

Tests must establish RED for all closed preflight mapping/order/no-effect
cases; preflight-observed `read_at`; post-confirm mutation; virtual scheduler
shape/cleanup; permanent Runtime/tool/every Artifact pending cases; zero writes
with already-aborted signal; no next unit after abort; success-manifest-last
candidate behavior; late-result admission rejection; and real Session
model/tool mismatch. Worker paths remain Application/Ports, three named
Adapters, and Profile only; Product Core, CLI, fixtures, manifests/dependencies,
durable schema, credentials, global Pi, board and other paths are forbidden.

Activation is Controller Spec Gate -> Test RED -> TDD_READY -> Worker GREEN ->
full regression -> one real M3 rerun -> independent Validator PASS ->
Controller acceptance. Rollback disables composition and never repairs,
deletes, or rewrites existing runs. Raw bytes, credentials, SDK objects,
transcripts, and provider payloads never cross Ports, prompts, logs, fixtures,
or Artifacts.
