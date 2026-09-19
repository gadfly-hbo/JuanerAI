# JuanerAI Product Planning Index

## Current product input — Blueprint v1.1 package（2026-09-18）

The user approved [JuanerAI Product Development Blueprint v1.0](2026-09-18/juanerai-product-development-blueprint-v1.0.md) as the first versioned product-development blueprint, grounded in JuanerAI Whitepaper v3.3.3. The user's later UI correction is recorded in [Blueprint v1.1](2026-09-18/juanerai-product-development-blueprint-v1.1.md): the first-slice value endpoint is unchanged, but the accepted PX-2026-004/006 Xanthil UI product mode must be reused rather than replaced.

The first vertical slice is a UI-first Xanthil Desktop Free membership-repurchase diagnosis Decision Case for non-technical users. The current planning package is the v1.0 base plus [Xanthil Desktop UI Contract v1.1](2026-09-18/xanthil-desktop-ui-contract-v1.1.md), the binding [PX-2026-004/006 adoption map](2026-09-18/xanthil-ui-reference-adoption-map-v1.0.md), and the user-confirmed [Session and Runtime Boundary v1.0](2026-09-18/xanthil-desktop-session-runtime-boundary-v1.0.md). It keeps the accepted quick/professional shell and full visible module set, while the first real integrated path remains the narrower professional membership-repurchase Case.

Review 001 returned `NEEDS_CLARIFICATION`; the corrected v1.0 package then received [Review 002 PASS](2026-09-18/reviews/ui-contract-development-readiness-review-002.md). Review 002 is historical because it reviewed the later-corrected assumption that quick/pro mode and Fork/Subagent could be excluded. Fresh [Review 003](2026-09-18/reviews/ui-contract-development-readiness-review-003.md) and [Review 004](2026-09-18/reviews/ui-contract-development-readiness-review-004.md) closed bounded state and completion gaps. Fresh [Review 005](2026-09-18/reviews/ui-contract-development-readiness-review-005.md) returned `PASS`. The user accepted the directly reused PX-2026-004/006 clickable UI on 2026-09-18; this closes the UI Gate for product mode and interaction, without claiming that simulated Desktop persistence, filesystem, Runtime or provider behavior is implemented. The later Session/Runtime supplement is a material plan addition; fresh [Session/Runtime Review 001](2026-09-18/reviews/session-runtime-development-readiness-review-001.md) returned `NEEDS_CLARIFICATION`. The user resolved its three gaps by retaining LLM-backed question organization without `010_draw`, selecting Case revision as the sole business revision in a one-Session/one-Case first slice, and defining Assistance Attempts separately from Analysis Runs. Fresh [Review 002](2026-09-18/reviews/session-runtime-development-readiness-review-002.md) returned `PASS`.

On 2026-09-19 the user authorized the first production OpenSpec Change and then authorized preparation and transfer of its execution package. [Execution Package v1.0](2026-09-19/xanthil-desktop-first-product-change-execution-package-v1.0.md) freezes the first-slice outcome, accepted UI and Session/Runtime decisions, role sequence, path and safety boundaries, Git authority, and evidence receipts. MacBook does not dispatch production roles. The Mac mini execution coordinator must first perform the package's read-only global-WIP preflight; the preserved old active pointer is not assumed empty and must not be cleared or modified without a separate minimum disposition authorization.

The same execution batch also uses the user-approved
[Routing Amendment 001](2026-09-19/xanthil-desktop-first-product-change-routing-amendment-001.md):
ordinary tasks use `high`, R2 tasks use `xhigh`, with no role-local effort pin.
The original v1.0 package bytes remain frozen. The earlier confirmed receipt
records Stage 0 and Stage 1 PASS, adoption of commit `ed3ac662`, and completion
of a formally dispatched `juaner_spec / xhigh` draft. The tool did not
independently echo actual runtime configuration; that evidence limit remains.
Stage 2 then stopped at `DEPENDENCY_DECISION_REQUIRED`, not a routing blocker.
The twelve Mac mini OpenSpec drafts are uncommitted and have not passed Spec Gate.

The user agreed to the Controller's Forge/Vite, local arm64 `.app`, SQLite plus
immutable-artifact, current-projection/history and opaque Session-root directions,
including the proposed 300/30-second budgets and zero automatic retries.
[Dependency and Structure Decision Package v1.0](2026-09-19/xanthil-desktop-dependency-structure-decision-v1.0.md)
consolidates the remaining exact dependencies, logical records, publication and
recovery contract, packaged E2E driver and staged lock/install permissions for
one overall approval. Fresh [Readiness Review 002](2026-09-19/reviews/dependency-structure-readiness-review-002.md)
returned PASS after withdrawing an incorrect new-task finding on formal-policy
readback. On 2026-09-19 the user explicitly confirmed all twelve decisions,
including the bounded P1–P5 preparation permissions and their stop lines.
This is not Spec Gate PASS or immediate implementation authority. MacBook
records and publishes the supplement for manual forwarding to the existing
`纵切-1.0` task; Mac mini adopts it by fixed-commit ff-only intake while preserving
its twelve drafts, then resumes Stage 2. The accepted old-WIP disposition is not
replayed and does not make the old Change CLOSED.

Mac mini subsequently confirmed fixed-commit ff-only adoption of `10c1df3785cdfe591f20b205fcd7d8b874f9e74d`, preserving all twelve drafts and Stage 0/1 PASS. Its latest exception is `DEPENDENCY_PREFLIGHT_BLOCKED_TOOLCHAIN`: the configured entry is absent, the inspected local Node is 25.9.0 rather than 26.0.0, and DuckDB is missing at that entry. P1–P3 and the new formal Spec revision have not started. The user explicitly approved [Toolchain Amendment 001](2026-09-19/xanthil-desktop-toolchain-amendment-001.md): prepare only a task-local pinned Node/DuckDB toolchain, reuse matching existing npm/Python, change no global installation/PATH or host services, and resume the same Stage 2 after health checks. MacBook publishes the supplement for manual forwarding to the original task; Mini preparation and compatibility remain unverified.

Current research-reference scope:

- PX-2026-001/002: hypothesis-first AnalysisOps human-workbench and real local vertical-integration principles;
- PX-2026-004/006: accepted Xanthil Desktop product UI mode, interaction semantics and visible capability inventory, with exact adoption recorded in the current attachment;
- Semantica/PX-2026-003 is not part of the first slice.

No product implementation, dependency installation, real provider call, real user study, or release is authorized by the blueprint alone.

## Historical withdrawal — remains VOID（2026-09-18）

The user withdrew all previously approved, not-yet-executed Xanthil Desktop
and Model Pack development plans. Their status is **VOID**, not paused or
awaiting dispatch. The new Blueprint v1.0/v1.1 package does not reactivate their roadmap,
fixtures, Changes, execution packages, or development sequence.

### Scope of withdrawal

- [`2026-08-27/`](2026-08-27/README.md): the Xanthil Desktop phase-one plan,
  two-phase Model Pack plan, sequencing, ownership/integration plans and all
  package attachments are historical reference only. The old
  `DA_REQUIRED_COMPLETE` -> Model Pack sequence is no longer the active roadmap.
- [`2026-08-28/`](2026-08-28/README.md): D0.5 decisions `D05-XD-001`, structure
  decisions `D05-XD-STRUCT-001`, release-timing amendment `D05-XD-PRG-001`,
  D1-A `D1A-XDSB-001`, dependency/provisioning policy `D1A-XDSB-DEP-001` and
  the pending `CHG-xanthil-desktop-session-bootstrap` execution plan are void
  as future development authority, including preparation/release of its
  semi-automatic execution package. Historical approvals do not reactivate them.
- Historical reviews, readbacks, Demo acceptance and baseline attestations
  remain evidence of what was checked then, not authorization for new work.
  The older [`2026-08-23/`](2026-08-23/) plans remain retired; withdrawal does
  not revive them. The full pre-withdrawal package, including bytes referenced
  by historical hashes, remains in Git at
  `e905d4b8b05b7fcceebb611d3c138197e0b8655a`.

### Retained assets and next input

Already developed JuanerAI features, source, permanent tests, accepted OpenSpec
and underlying architecture remain available for continued use. In particular,
completed CLI/local-analysis, TypeScript migration and Model Pack contract-enabler
work are not invalidated or removed. New whitepaper-driven work should reuse
them and revise only what an approved new requirement needs. No test verdict,
historical failure or acceptance record is rewritten by this decision.

The semi-automatic dual-device workflow, OpenSpec/TDD/independent validation,
permissions and data-safety rules remain in force. Withdrawal of a future release
plan is not a waiver permitting public release. Research Demos and the whitepaper
remain reference inputs unless their precise scope is adopted by the versioned
blueprint and its approved attachments. Demo evidence never becomes production
acceptance or execution authority by being referenced.

Old repair evidence and isolated Host Loop assets stay preserved. This decision
does not restart automation, clear the retained active pointer, mark the old
Change accepted/CLOSED, or authorize service/host changes. Any later execution
must explicitly resolve reserved WIP under the existing execution policy.
