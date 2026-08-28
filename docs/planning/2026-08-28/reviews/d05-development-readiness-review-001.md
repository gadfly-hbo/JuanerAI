# D0.5 Development-readiness Review 001

> Review ID: `D05-XD-REVIEW-001`
> Role: fresh read-only implementation-perspective Reviewer
> Date: 2026-08-28
> Verdict: `NEEDS_CLARIFICATION`

## 1. What I Would Build

After user approval and a separate D1-A intake, implement only `CHG-xanthil-desktop-session-bootstrap`: a packaged Electron surface that creates or opens a synthetic local Project, selects `quick` or `professional` only for a new Session, provisions a durable fixed-mode Session atomically, and reopens the same identity and mode. The state is `not_started`; there is no Run, Evidence, report, Fork, Subagent, Python, Pi/model, network, or analysis behavior.

## 2. Required Guessing

1. The package did not attest that ADR 0002's mandatory TypeScript migration was complete.
2. Project-root selection, Project creation/readback, existing or malformed manifests, and duplicate/concurrent creation were not closed.
3. Incomplete Session recovery said remove or quarantine, and the one-writer rule lacked acquisition, collision, stale-writer, linearization, and late-result semantics.
4. The top selector's behavior while an existing fixed-mode Session is active was not deterministic.
5. Change 1 did not distinguish hosted Windows build/smoke from real Windows 11 acceptance.
6. Python filesystem/network/subprocess, memory/output, process-tree termination, and partial-output semantics were not divided into enforced versus trusted-code claims.
7. Fork/Subagent durable grain, queue capacity/full behavior, Runtime binding, and return/adoption races were open.
8. `member-orders-v2` could be misread as a requirement of the bootstrap Change rather than the integrated first-phase vertical.

## 3. External Study Required

A read-only current-baseline attestation was required for ADR 0002. No Demo or pi-xanthil repository study was required or permitted to rescue plan gaps. Signing/notarization credentials and a controlled Windows 11 x64 host remain external host prerequisites rather than research inputs.

## 4. Untestable Requirements

The prior remove-or-quarantine recovery wording, unbounded queue/single-writer wording, fixed-mode selector behavior, first-Change Windows evidence tier, Python limit terminals, and Fork/Subagent races could not derive closed positive/negative acceptance tests.

## 5. Correctly Deferred

Exact dependency versions/checksums, manifest fields and JSON Schema, temporary/lock representation, fsync mechanics, preload method names, IPC serialization, scheduler implementation, Runtime Port delta, report/feedback executable contracts, exact allowed paths, and OpenSpec contents are correctly deferred once their product semantics are closed.

## 6. Required Plan Additions

Add the baseline attestation; Project bootstrap contract; one recovery disposition; complete concurrency/linearization package; deterministic selector rule; phase-by-phase platform evidence matrix; Python enforcement/terminal semantics; independent-conversation grain and races; integrated-vertical clarification; and an explicit statement that this review does not replace post-authorization D1-A review.

## 7. Verdict

`NEEDS_CLARIFICATION`

The Controller therefore kept the Gate at `D0.5_DEVELOPMENT_READINESS_REVIEW`, made no Product Change or executable contract, and prepared a materially corrected package for a new fresh Reviewer.
