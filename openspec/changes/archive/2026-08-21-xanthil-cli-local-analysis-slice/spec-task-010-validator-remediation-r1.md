# TASK-010 Validator FAIL Remediation R1

## Status

**REJECTED_R1 / SUPERSEDED_BY_R2 — not a Gate candidate.**
This retained draft is superseded by
`spec-task-010-validator-remediation-r2.md` after Controller found the
non-null initial-manifest `read_at` and deadline terminalization contradictions.
It changes no
product scenario, durable schema field, provider egress allowance, tool set, or
retry policy. It authorizes no production/test/dependency/board write before
the next gates.

## Objective and Scope

Restore four violated approved contracts: pre-Discovery physical admission,
actual source-read provenance, active end-to-end deadline enforcement, and
actual Pi state observation. The delivery objective is a fail-closed, fully
validated personal synthetic run; the learning objective is to prove that the
same Port contracts prevent model calls, artifacts, and late writes when those
conditions fail.

Out of scope: new persistence objects/fields, raw-row model egress, retries,
new tools, changing Analysis semantics, Pi replacement, real data, session
resume, recovery, or Enterprise behavior.

## Structure Governance

No new structure decision is required. Approved structure item 7 already
requires each source descriptor to record a **read time**. Replacing
`confirmed_at` with the actual approved-source read observation restores that
existing field meaning; its identity, cardinality, path, hash, bytes, version,
writer, version, atomicity, and retention are unchanged.

## Requirements and Acceptance Criteria

### R10-REQ-001 — Physical preflight before Discovery

Application SHALL, before opening the Agent Runtime session, entering
Discovery, emitting a Proposal, creating a run, or any model call: validate
safe run root; resolve the approved workspace-relative fixture with realpath
containment/regular-file checks; read its exact bytes solely for identity and
semantic fixture validation; verify SHA-256, byte size, CSV closed schema,
row/order/date/duplicate constraints; and verify explicit runtime/model
readiness.

This internal identity read is not analytical execution, does not create a
run/asset, and does not egress rows or bytes to the model. The approved
pre-confirmation prohibition means no **analytical** source-row read, SQL,
Python, or model row egress; it does not prohibit this fail-closed local
identity validation.

- **R10-AC-001-01:** Missing/mutated/malformed/escaping fixture, unsafe run
  root, unavailable runtime/model, or unsupported contract terminates before
  Runtime open/Discovery/model call/Proposal/run, with the existing stable
  preflight code and no source/global write.
- **R10-AC-001-02:** After confirmation and before analytical profiling, the
  Local Analysis Adapter re-resolves and rechecks the same physical identity;
  any post-preflight mutation maps `SOURCE_CHANGED`, admits no supported
  Finding, and records no raw rows.
- **R10-AC-001-03:** The preflight Port returns exactly the closed
  Application-owned approved-source identity descriptor
  `{source_id,kind,path,sha256,byte_size,fixture_version}`; it exposes neither
  filesystem handles nor raw bytes to Runtime/Application business results.

### R10-REQ-002 — Actual read provenance

The Source Adapter SHALL return an RFC3339 `read_at` observation at the actual
approved-source analytical read after the post-confirmation identity recheck.
Application SHALL persist that value in `sources[].read_at`; it SHALL NOT
substitute `confirmed_at`, preflight time, mtime, or model time.

- **R10-AC-002-01:** A successful run records the Adapter-observed source read
  instant, distinguishable from confirmation time under a test clock.
- **R10-AC-002-02:** No source descriptor is persisted for a pre-confirmation
  or failed-before-read path; failed/cancelled runs cannot claim an unobserved
  source read.

### R10-REQ-003 — Active total-attempt deadline

At run allocation, Application SHALL create one attempt-owned AbortController
and schedule its expiry at the existing 300-second total-attempt deadline; the
timer is armed before any post-confirmation Runtime, Analysis, or Artifact
await. At expiry it SHALL atomically close Application admission, abort that
one signal, invoke the Runtime cancellation request, and resolve the attempt as
`TIMEOUT` without awaiting an unbounded promise. "Quiescence" here is closed
Application admission: every continuation checks the attempt epoch before a
Port call, result acceptance, or manifest/asset write and is discarded once
the epoch closes. Each participating Port SHALL honour the supplied signal by
settling or by guaranteeing it makes no mutation after abort; a Port that later
settles cannot regain admission. If terminal persistence is already unavailable
or cannot be admitted, the logical terminal is failure/no-success with the
existing in-progress/abandoned-candidate state, not a background repair. If it
is admitted before expiry, at most one `TIMEOUT` replacement manifest may be
committed. No background completion may write after terminalization.

- **R10-AC-003-01:** A permanently pending Runtime, tool callback, or Artifact
  operation reaches `TIMEOUT` without real waiting through a test-owned virtual
  scheduler/clock; no later model/tool/asset/manifest write is admitted.
- **R10-AC-003-02:** Cancellation/deadline race closes admission once, signals
  the same AbortSignal to Runtime and active Ports, makes Application
  continuations quiescent without awaiting a permanently pending Promise, and
  produces one cancelled or timed-out terminal result according to the first
  accepted cause; no retry occurs.
- **R10-AC-003-03:** If terminal persistence itself cannot settle safely,
  Xanthil makes no success claim and leaves only the approved in-progress/
  abandoned-candidate semantics; it does not schedule background repair/write.

### R10-REQ-004 — Observed Pi state

The production Pi facade SHALL project actual identity only from
`session.model` and actual active tools only from `getActiveToolNames()` after
the SDK operations settle. Requested values remain construction input and
cannot be echoed as observations.

- **R10-AC-004-01:** Actual provider/model or active-tool mismatch fails closed
  before accepted output with sanitized `MODEL_EXECUTION_FAILED` or
  `TOOL_POLICY_VIOLATION` as applicable.
- **R10-AC-004-02:** The deterministic facade contract separately supplies
  observed state; tests prove requested-vs-actual mismatch rather than a
  mirrored requested value.

## Design and Rejected Alternatives

Application orchestrates preflight through four closed business methods. The
Run Artifact Port adds `preflightRunRoot()` and returns exactly `{ready:true}`.
The Local Analysis Execution Port adds `preflightApprovedFixture({source})` and
returns the identity descriptor above; it adds no raw-byte result. The Agent
Runtime Port adds `preflightModel({model})` and returns exactly the observed
`{provider,model_id}` after the approved local-only readiness sequence but
before Session creation. The existing `profileApprovedFixture` receives the
attempt signal, repeats physical identity validation after confirmation, does
the first analytical row read, and returns exactly `{profile,read_at}`. All
other existing analytical operations receive the same signal.

Application receives a composition-owned, business-neutral deadline scheduler
with exactly `schedule({at,callback}) -> {cancel}`; the Profile supplies the
production timer and Test supplies only a test-private virtual implementation.
The callback is not a business Port result and introduces no test mode. The
Application establishes a monotonically increasing attempt epoch. It checks
the open epoch before every Port admission and after every await; expiry or
user cancellation closes it once. This gives a hard 300-second resolution even
when an implementation violates cancellation by never resolving. The Port
contract suite must separately reject any Adapter that mutates after its input
signal is aborted. This keeps filesystem/Pi types in Adapters and preserves
same-session native tools.

Rejected: defer fixture validation until tools (model call already violates
boundary); pass raw bytes/handles to Runtime (egress/Port leak); set `read_at`
from Application confirmation (false provenance); passive post-await deadline
check (cannot stop pending work); Product retry or background repair; facade
echo of requested state.

## Gates, Paths, Tests, Activation

Spec -> Controller Spec Gate -> Test derives causal RED -> Controller TDD_READY
-> Worker -> full regression + one real M3 rerun -> independent Validator.
Test owns existing TASK-010 remediation test paths and may use a test-private
virtual scheduler; Worker must not add production test modes.

Allowed Worker paths: `packages/application/local-analysis.mjs`,
`packages/ports/local-analysis.mjs` only for the four closed preflight and
deadline/cancellation contract values,
`adapters/analytics-duckdb/local-analysis.mjs`,
`adapters/storage-local/local-analysis.mjs`,
`adapters/agent-pi/local-analysis.mjs`, and
`profiles/personal/local-analysis.mjs` only to compose the scheduler. Test-only
allowed paths are exactly `tests/contract/xanthil-local-analysis/**`,
`tests/integration/xanthil-local-analysis/**`,
`tests/e2e/xanthil-local-analysis/**`, and necessary matching
`tests/fixtures/xanthil-local-analysis/**`; a virtual scheduler is test-private.
Conditional durable-record path is none: the existing `read_at` field is
restored, not extended. Forbidden: Product Core, CLI, fixture bytes,
manifests/dependencies, global Pi, credentials, board, other surfaces, and all
new schemas/fields.

Causal RED: preflight tests prove zero Runtime open/model call; mutation
recheck proves `SOURCE_CHANGED`; virtual-time pending Runtime/tool/Artifact
tests prove active abort/no late writes; observed-state tests prove non-echo
mismatch; provenance test proves actual read time. Existing R4 parser/template
tests remain unchanged. Real M3 reruns only after deterministic GREEN because
preflight/order/actual-state changes touch the production path; it uses the
same approved synthetic fixture and records no secret/raw payload.

Activation remains blocked until remediation GREEN, full regression, real M3
success, Validator PASS, and Controller acceptance. Rollback disables
composition only, preserves Artifacts, performs no retry/repair, and retains
the personal trusted-local/no-raw-row-egress boundary.
