# TASK-010 R3 User-Cancellation Linearization Decision

## Status

**DECIDED — user approved `XCLI-TASK010-CANCEL-LINEARIZATION-001`, Option A
(success-linearization wins).** This document is decision provenance only.
`spec-task-010-validator-remediation-r3-cancel-linearization-001.md` is the
sole normative clarification after its Controller Spec Gate PASS. This record
introduces no status, schema, Port/API, retry, cleanup, tool, model, or
dependency.

## Finding

R3 uniquely settles three parts of this race, but not its final product
choice:

- User cancellation closes *normal future admission* and asks the Runtime to
  cancel; it deliberately leaves the absolute-deadline signal live.
- Deadline expiry is the atomic winner over every not-yet-linearized
  publication unit, aborts that signal, starts no next unit, and produces
  `TIMEOUT` without a terminal write.
- R3 expressly does not claim that physical I/O already issued to an Adapter
  cannot finish. `commitSuccess` has one success linearization point: the
  final atomic replacement of `run.json`.

Those rules do not say whether a user cancellation must defeat an already
admitted, still-live `commitSuccess` whose final `run.json` has not yet
linearized. Both outcomes can preserve the existing status union and the
deadline rule, but they give a different user-visible result. Therefore the
current R3 text cannot uniquely justify TEST-XCLI-017's unconditional
cancelled-terminal and no-success assertions for the pending-`commitSuccess`
case.

This is the deterministic gap reported by the independent Validator. It is
not a reason to weaken the remaining cancellation test cases or to release an
Application Worker.

## What Existing R3 Already Requires

The following expectations are executable without a new product decision.
They distinguish starting a new unit from an already-admitted pending unit.

| Pending unit at user `cancel()` | Already-issued unit | Prohibited after cancellation | Required convergence before deadline |
|---|---|---|---|
| `beginRun` | It may physically linearize because its live signal was already admitted. | `commitConfirmedContract`, Runtime, assets, and `commitSuccess` SHALL NOT be newly admitted. | If the run becomes visible, exactly one cancelled terminal `run.json` SHALL subsequently linearize; if `beginRun` never linearizes before deadline, expiry wins and no terminal write is attempted. |
| `commitConfirmedContract` | It may physically linearize. | Runtime, assets, and `commitSuccess` SHALL NOT be newly admitted. | The existing allocated run SHALL receive exactly one cancelled terminal before deadline; if the pending unit has not settled by expiry, `TIMEOUT` wins with no terminal write. |
| `appendAsset` | Its one target-file publication may physically linearize. | The next asset, Runtime continuation, and `commitSuccess` SHALL NOT be newly admitted. | The existing allocated run SHALL receive exactly one cancelled terminal before deadline; a late asset is not Evidence/success and must not regain normal admission. |
| `commitSuccess` | Its candidate files and final succeeded `run.json` can be physically in flight. | No new normal unit may be admitted. | The resolved Option A below orders the competing terminal transition. |

For the first three rows, `confirm()` and `cancel()` may await the already
admitted unit only until the unchanged absolute deadline. They SHALL converge
to the one cancelled result when its cancelled terminal linearizes. They SHALL
converge to `TIMEOUT` if expiry occurs first. A user cancellation does not
authorize an unbounded wait, background repair, a second run, or an
unterminated visible `in_progress` run after an already-issued `beginRun`
has settled.

The required cancelled terminal is exceptional terminal admission, not a
normal continuation: it is allowed solely to close an already visible
in-progress run. It does not admit contract, Runtime, analysis, asset, or
success work.

## Resolved Decision: Pending `commitSuccess`

The user chose Option A for a user cancellation that occurs after
`commitSuccess` has been admitted with a still-live deadline signal and before
its final succeeded `run.json` linearizes. Deadline expiry remains the
absolute winner. Option B is retained only as the rejected alternative.

### Option A — Success Linearization Wins (approved)

The already-admitted `commitSuccess` retains its right to reach its final
linearization point. Application waits only until it settles or the unchanged
deadline expires; it does not issue a concurrent cancelled terminal write.

- If final succeeded `run.json` linearizes first, `succeeded` is authoritative;
  `confirm()` and `cancel()` converge to the same succeeded result and no
  cancelled manifest is written.
- If `commitSuccess` settles without success linearization, Application may
  admit exactly one cancelled terminal, and both calls converge to it.
- If deadline expiry occurs first, it aborts the signal, no further terminal
  write begins, and both calls converge to `TIMEOUT`; a late completion cannot
  regain success.

This option follows the existing deliberate distinction between an un-aborted
user cancellation and deadline's explicit atomic-winner rule. It needs no new
Adapter command or durable contract and avoids competing terminal writes.

### Option B — User Cancellation Wins

User cancellation must prevent an already-admitted `commitSuccess` from
linearizing success and must make the cancelled terminal authoritative.

This is a stronger new atomic-winner guarantee than R3 currently assigns to
user cancellation. Before it can be specified as an implementation rule, the
Controller must approve how an already-issued final atomic rename is prevented
or ordered without a new race, including the necessary Adapter concurrency
guarantee. The present R3 signal is intentionally live after user cancellation,
so current text does not supply that mechanism.

## Required Test Correction Under Approved Option A

TEST-XCLI-017 SHALL retain its current causal assertions for pending
`beginRun`, `commitConfirmedContract`, and `appendAsset`, including no normal
post-cancel admission and one cancelled terminal when the gated unit settles
before expiry. It SHALL separately retain deadline-race coverage: expiry
aborts the signal, wins over all unlinearized units, and starts no terminal
write.

For pending `commitSuccess`:

- Replace the unconditional cancelled/no-success assertion with two
  deterministic branches: a gated successful final-manifest branch where
  `confirm()` and `cancel()` converge to succeeded and no cancelled terminal
  exists; and a gated non-successful settlement branch where they converge to
  one cancelled terminal. In both branches no new normal admission follows
  cancellation.

The test SHALL NOT make `cancel()` resolve while an already-visible run is
left `in_progress`, and SHALL NOT use timing, production seams, retries, or
cleanup to manufacture the ordering.

## Worker Boundary After Resolution

No Worker is released by this document. Test must first freeze the
corresponding causal RED/updated assertion.
Only then may the minimum Application-only repair be considered:
`packages/application/local-analysis.mjs`. Production Adapter, Port, schema,
Profile, fixture, dependency, and project-control changes remain forbidden
unless Option B reveals a separately approved contract change.

## Validation, Activation, Rollback, and Retirement

Validation is deterministic virtual-scheduler/pending-Artifact coverage plus
the existing complete regression. A successful correction still requires the
existing real MiniMax-M3 rerun and fresh independent Validator PASS before
acceptance. Activation and rollback remain R3's existing composition disable
and no-repair/no-delete policy. This decision note retires only when its chosen
policy is incorporated into the authoritative R3 clarification and the
associated Test/Worker/Validator gates are complete.
