# CHG-xanthil-desktop-session-bootstrap D1-A Product Plan Review 001

> Review ID: `D1A-XDSB-REVIEW-001`
> Role: unique fresh read-only D1-A Product Plan Reviewer
> Date: 2026-08-28
> Verdict: `NEEDS_CLARIFICATION`
> Dispatch disposition: `BLOCKED_FOR_PLAN_CORRECTION`

## 1. What I Would Build

A minimal Application-led Desktop Project/Session bootstrap on packaged macOS Apple Silicon and controlled real Windows 11 x64: create or idempotently open a local Project, explicitly create an immutable-mode Session, reveal its manifest and three directories only after atomic publication/readback, and retain identity/mode after restart. The renderer uses a narrow preload into Desktop Profile/Application, and Application is the sole semantic writer. Analysis, Python, Pi/Runtime change, real data/network, report, Fork, and Subagent behavior are excluded.

## 2. Required Guessing

None for product semantics. Product grain, identity, immutable mode, publication/cancellation winners, quarantine, readback, CLI compatibility, UI source split, cross-platform acceptance, and non-goals are closed.

## 3. External Study Required

None. Windows host, signing/notarization, Mac mini baseline, and WIP pointer are `ACTIVATION_OR_HOST_VALIDATION` prerequisites rather than product research gaps.

## 4. Untestable Requirements

None at the product level. Atomic collision, readback failure, cancellation/publication race, crash recovery, second-instance routing, restart, path, and manifest failures have derivable Test classes. Real Windows/signing evidence remains blocked on prerequisites and cannot be replaced by CI.

## 5. Correctly Deferred

- `[IMPLEMENTATION_DETAIL]` Manifest fields, serialized errors, temporary names, sync/lock implementation, IPC, and component names.
- `[IMPLEMENTATION_DETAIL]` Exact Electron/Forge/React/Vite versions, lock bytes, install-script review, and platform build details, subject to a correct pre-RED dependency Gate.
- `[NON_BLOCKING_FOLLOWUP]` Python/DuckDB, analysis, Run, Fork/Subagent, report, feedback, Model Pack, and Runtime changes.
- `[ACTIVATION_OR_HOST_VALIDATION]` D0.5 integration, empty WIP pointer, real Windows host, signing/notarization, and Mac mini executable baseline.

## 6. Required Plan Additions

- `[SPEC_BLOCKER]` Correct the dependency/RED Gate order. The original §7 deferred exact dependency/lock/toolchain health until before Worker, even though DISPATCH freezes the dependency boundary and Test must establish causal RED in a healthy environment. The plan must define when the exact dependency policy is frozen, who may mechanically materialize it, a separate environment-health proof, and the rule that missing packages/runners or unreviewed install scripts are conflict/blocker evidence rather than RED.

## 7. Verdict

`NEEDS_CLARIFICATION`

Dispatch disposition: `BLOCKED_FOR_PLAN_CORRECTION`.

The policy permits one bounded semantic correction and Controller targeted readback. It does not permit an automatic second D1-A Reviewer. External prerequisites remain independently blocking after the plan correction.
