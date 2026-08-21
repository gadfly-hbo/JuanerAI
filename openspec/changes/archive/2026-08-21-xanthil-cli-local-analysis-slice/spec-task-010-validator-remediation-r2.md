# TASK-010 Validator FAIL Remediation R2

## Status

**REJECTED_R2 / SUPERSEDED_BY_R3 — not a Gate candidate.**
R2 is retained as rejected history; R3 closes its artifact linearization and
historical-rule conflicts. It retains the approved product scenario and durable Run
schema; it authorizes no production, test, dependency, credential, board, or
external write before the next Gate.

## Objectives, Scope, and Structure Governance

Product objective: prevent an unverified local source, unsafe run root, or
unready runtime from reaching Discovery. Delivery objective: make physical
identity provenance, total-attempt termination, and Pi provenance observable
and fail closed. Learning objective: prove causal prevention of a model call,
late write, and requested-state echo.

No durable-structure decision is required. Structure-confirmation item 7
already defines `sources[].read_at` as source **read time**. R2 restores that
meaning using the actual approved-source identity byte read that occurs before
the mandatory initial manifest. It does not add/change a field, nullability,
writer, identity, cardinality, retention, or atomicity.

Out of scope: a new source, model, tool, retry, run status, persistence field,
raw-row model egress, recovery/background repair, or Enterprise behavior.

## Normative Requirements and Observable AC

### R2-REQ-001 — Pre-Discovery physical admission and source provenance

`start()` SHALL call the following methods in this exact order before
`openSession`, Discovery, Proposal, model call, `beginRun`, or any Artifact
write:

1. `RunArtifactStore.preflightRunRoot()` returns exactly `{ready:true}` after
   realpath/directory/non-root/safe-root validation and no write.
2. `LocalAnalysisExecution.preflightApprovedFixture({source})` returns exactly
   `{source_id,kind,path,sha256,byte_size,fixture_version,read_at}` after
   realpath containment/regular-file validation and one local exact-byte read
   that verifies SHA, byte count, closed CSV columns/rows/order/date/duplicate
   rules. `read_at` is the Adapter-observed RFC3339 instant of that actual
   approved-source read.
3. `AgentAnalysisRuntime.preflightModel({model})` returns exactly the observed
   `{provider,model_id}` after the R4 local-only ModelRuntime snapshot sequence;
   it may not make a model/provider network call or create an AgentSession.

The source read is an internal physical identity/semantic validation read, not
SQL/Python/analytical execution, creates no run, returns no bytes/handle, and
egresses no row/byte to the Runtime/model. Application compares every result
to frozen approved business values. A failure maps to the existing closed
preflight vocabulary and has no source/global write.

After confirmation, `profileApprovedFixture` repeats the same physical
identity validation immediately before its analytical read. It returns only
the existing profile value; it does not return or persist a second read time.
Mismatch is `SOURCE_CHANGED`, causes no Finding, and does not revise the
preflight snapshot. On success Application copies the already observed
preflight `read_at` unchanged into the required initial manifest before
`beginRun`.

- **R2-AC-001-01:** Missing, escaping, malformed, changed, or mismatching
  fixture; unsafe root; unavailable/mismatching model; and unsupported version
  are rejected before Session/Discovery/model/Proposal/run/write.
- **R2-AC-001-02:** A successful initial manifest contains exactly the
  preflight observed `read_at`; confirmation time, mtime, model time, and the
  later profile read cannot substitute it.
- **R2-AC-001-03:** A between-phase source mutation fails `SOURCE_CHANGED`
  before supported output; neither bytes nor a filesystem capability enters a
  Port result, Runtime context, model prompt, run record, or artifact.

### R2-REQ-002 — Hard deadline, admission, and Artifact behavior

Immediately when confirmation is accepted and **before** `beginRun`,
Application creates one attempt epoch and one `AbortController`, then invokes
the composition-owned scheduler once with the exact frozen request
`{at_epoch_ms: confirmation_clock_epoch_ms + 300000, callback}`. `at_epoch_ms`
is a finite safe integer Unix epoch milliseconds value. `callback` is a
zero-argument synchronous function that returns exactly `undefined`; it closes
the epoch once, aborts the one signal, requests Runtime cancellation without
awaiting an unbounded Promise, and selects logical `TIMEOUT`. Scheduler returns
one frozen closed handle `{cancel}`; `cancel()` takes no argument, returns
exactly `undefined`, and is idempotent. Application cancels the handle exactly
once on any accepted normal, failed, cancelled, or timed-out terminal path.

`beginRun`, `commitConfirmedContract`, `appendAsset`, `replaceManifest`, and
`commitSuccess` each receive the same attempt `cancellation_signal`, and are
admitted only while the epoch is open and the signal is not aborted. Every
Artifact Adapter operation SHALL make no mutation if its signal is already
aborted and shall make no later mutation after that signal aborts. Its
already-started write is one atomic operation: it either commits its complete
documented unit before abort wins, or commits nothing; no partial core
record/asset is exposed.

For user cancellation, Application closes normal work admission and requests
the Runtime's idempotent cancellation without initially aborting the deadline
signal. It waits only until normal Runtime settlement or the existing absolute
deadline. If Runtime settles before deadline, it admits exactly one cancelled
`replaceManifest` with the still-unaborted shared signal and then cancels the
scheduler. If it remains pending, deadline aborts the signal, user
cancellation is superseded by logical `TIMEOUT`, and no terminal persistence is
started. Thus terminal persistence never follows an aborted shared signal.

At deadline Application never initiates `replaceManifest`, `commitSuccess`,
or any other Artifact write. It returns logical `TIMEOUT`; an already-created
in-progress run is an existing abandoned candidate, and no background repair,
terminal replacement, retry, or late write is scheduled. Application does not
await a permanently pending Runtime/tool/Artifact promise. It gates every
continuation before a Port call and after an await by the open epoch, so late
settlement is discarded. The Runtime, native callbacks, Analysis, and each
admitted Artifact call receive the same signal.

- **R2-AC-002-01:** Virtual time advances a permanently pending Runtime,
  native tool/Analysis, or Artifact call to one logical `TIMEOUT` without real
  wait and without any late Application write/result.
- **R2-AC-002-02:** At deadline no terminal persistence is attempted; an
  already-created run remains only in its valid in-progress state. A pending
  `beginRun` may not later create a run after abort.
- **R2-AC-002-03:** A user cancellation that settles before deadline commits
  one cancelled terminal using the un-aborted shared signal. A cancellation
  still pending at deadline is superseded by one `TIMEOUT` signal abort with no
  terminal write. Either branch has one scheduler cancellation, no retry, and
  no background work.

### R2-REQ-003 — Observed Pi runtime state in one runtime/session

`preflightModel({model})` creates and retains exactly one local
`ModelRuntime`/selected model pair using R4's
`ModelRuntime.create({allowModelNetwork:false,refreshOnCreate:false})`, exactly
one explicit `refresh({allowNetwork:false})`, then `getModel`. It retains no
AgentSession and returns the selected model's observed closed identity.
`openSession` subsequently creates exactly one real AgentSession from that
cached runtime/model pair; it creates neither a second runtime nor a fallback
model. This supersedes the former TEST-XCLI-011 assertion that pre-prompt
`openSession` has no local credential read: R2 Test instead proves that neither
preflight nor openSession makes a model/provider network call, persists a
session, exposes a credential, or accepts an ambient default.

At Execution activation, after that same real session exists, the Pi facade
synchronously calls `session.setActiveToolsByName(approved_names)`, then
`session.getActiveToolNames()`, and returns only the latter closed observed
array. When actual model provenance is required it reads that same
`session.model`, projects `{provider,model_id}`, and compares it to the explicit
selection. Requested construction values are never an observation. Either
model/tool mismatch fails closed with the existing sanitized product error.

- **R2-AC-003-01:** A deterministic facade whose requested values differ from
  session-observed model/tools is rejected; matching observed values are
  accepted without Pi types crossing Ports.
- **R2-AC-003-02:** Real acceptance observes the one same-session actual model
  and active names after deterministic GREEN; no second runtime/session or
  model fallback is created.

## Architecture, Data/Security, Failure, Activation, and Rollback

Adapters own filesystem/Pi access; Application owns order, closed comparison,
epoch admission, and persistence command selection; Product Core remains
unchanged. Raw source bytes, credentials, SDK objects/errors, transcripts, and
provider payloads remain outside Port values, prompts, logs, fixtures, and
Artifacts. R2 uses only local model-catalog readiness and makes no catalog
network refresh.

Activation requires Controller Spec Gate PASS; Test causal RED; Controller
TDD_READY; minimum Worker GREEN; complete regression; one real MiniMax-M3
rerun after deterministic GREEN; independent Validator PASS; Controller
acceptance. Rollback disables composition only; it never writes repair data or
changes existing runs. The real M3 rerun is not legal before deterministic
GREEN and is not proof of fixture semantics.

## Task/Path Mapping and Validation Intent

Test may write only `tests/contract/xanthil-local-analysis/**`,
`tests/integration/xanthil-local-analysis/**`,
`tests/e2e/xanthil-local-analysis/**`, and matching
`tests/fixtures/xanthil-local-analysis/**`; virtual time is test-private.
Worker may write only `packages/application/local-analysis.mjs`,
`packages/ports/local-analysis.mjs`,
`adapters/analytics-duckdb/local-analysis.mjs`,
`adapters/storage-local/local-analysis.mjs`,
`adapters/agent-pi/local-analysis.mjs`, and
`profiles/personal/local-analysis.mjs`. Product Core, CLI, fixtures,
dependencies/manifests, global Pi, credentials, persistence schema, board, and
all other paths are forbidden. There are no conditional durable paths.

Test derives RED for closed request/result/error shapes and exact call order;
zero preflight side effects; post-confirm mutation; clock-distinct `read_at`;
pending Runtime/tool/each Artifact operation; epoch late-result rejection;
atomic abort behavior; observed-vs-requested Pi mismatch; and revised lazy
readiness/no-network behavior. Existing R4 parser/template/tool ordering and
no-fallback cases remain unchanged.

Rejected alternatives: analytical `read_at` after confirmation (cannot fill
the non-null initial manifest without a schema change); timeout terminal write
after the shared signal aborts (not safely admissible); bounded wait for an
unbounded promise; a second Runtime/session; facade request echo; source bytes
or handles crossing a Port; and test-only production scheduling.
