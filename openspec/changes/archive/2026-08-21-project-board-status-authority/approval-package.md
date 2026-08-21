# PBSA-PACKAGE-001 — Minimum Change Approval Package

Status: **APPROVED — ALL RECOMMENDED A OPTIONS (2026-08-21)**

The durable structure in `structure-confirmation.md` is already approved. This
package asks only for the executable CLI details derived from it.

## 1. Current-state publication

Recommendation: **A — keep the existing validated same-directory temporary
write plus atomic rename for `status.json`; successful rename is the sole
current-state publication point.**

Reason: this is the smallest mechanism that prevents partial current JSON and
already exists in the restored baseline.

Alternative B: event-first or multi-file publication. Rejected because an
event is non-authoritative and must not admit current state.

## 2. Event-append warning contract

Recommendation: **A — one failed post-publication event attempt returns exit
0 and writes exactly one stderr line:**

```json
{"level":"warning","code":"PROJECT_BOARD_EVENT_APPEND_FAILED"}
```

Reason: the authoritative write succeeded; stable JSON is executable and does
not leak paths or platform error text.

Alternative B: return nonzero or include raw filesystem diagnostics. That
misstates authoritative success or creates an unstable/sensitive contract.

## 3. Command coverage

Recommendation: **A — apply the same one-attempt warning behavior to events
following status and brief writes, and to the event-only command. Invalid
candidates and status/brief publication failures remain nonzero.**

Reason: `events/` has one meaning regardless of which public command requests
the append. Status/brief writes are validated and atomic before the event.

Alternative B: special-case status commands only. That leaves inconsistent
meaning and exit behavior for the same non-authoritative event store.

## 4. Test boundary

Recommendation: **A — one focused public-CLI test file covers single-file
status atomicity, pre-write validation, real event failure isolation, current
status display, and existing read-only regression. No concurrency/FIFO tests.**

Reason: this matches the supported single-Controller contract and keeps the
RED tied to observable behavior.

Alternative B: retain transaction/concurrency tests. Rejected because those
assert an explicitly unsupported scenario and recreate the cancelled loop.

## 5. Implementation and activation

Recommendation: **A — after Spec Gate and RED, Worker may change only
`status-cli.mjs`; no helper, schema, persistent layout, server/browser, or
dependency change. Activation occurs only after GREEN, regression, fresh
Validator, and acceptance.**

Reason: the missing behavior is CLI orchestration, not storage structure.

Alternative B: change shared helpers or activate before independent evidence.
That widens impact without serving the approved minimum behavior.

## Overall Recommendation

Approve all A. Formal approval phrase:

`批准 PBSA-PACKAGE-001 全部 A`

The user gave this exact approval in the Codex CLI on 2026-08-21. The five
recommended A decisions are frozen for this Change.
