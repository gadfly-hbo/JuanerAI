# Xanthil Desktop Session and Runtime Boundary v1.0

## Document control

| Field | Value |
|---|---|
| Parent | [JuanerAI Product Development Blueprint v1.1](./juanerai-product-development-blueprint-v1.1.md) |
| UI contract | [Xanthil Desktop UI Contract v1.1](./xanthil-desktop-ui-contract-v1.1.md) |
| Version | `1.0` |
| Decision date | 2026-09-18 |
| User decision | Retain `060_reports`; accept the corrected first-slice Session, Case, directory, Assistance Attempt and Pi Runtime boundary |
| Status | Explicit user corrections received; fresh Development-Readiness Review 002 `PASS` |

This attachment closes the product-level ambiguity exposed after the user UI
Gate. It defines what the first real Desktop vertical slice must do and what
may remain a later implementation or structure decision. It does not authorize
OpenSpec, production implementation, dependency installation, provider calls,
real data, commit, push or release.

## 1. Product and execution identities

The first slice uses one real local Project. Within that Project, the product
must not treat these identities as one object:

1. **Product Session** — the durable, user-visible analysis workspace. It has a
   stable product-owned identity, fixed quick/professional mode, history and
   recovery state. It remains available after the application or Agent Runtime
   stops. In the first slice, one professional Product Session contains exactly
   one Decision Case; multi-Case Sessions are deferred.
2. **Case revision** — the only business revision axis inside that Session. It
   owns Draft/Ready/Review/Needs attention/Completed state, the confirmed data
   scope and model-exposure approvals. There is no separate Product Session
   revision. Editing a computation-affecting input or importing a new snapshot
   creates a new Case revision and preserves the old revision as history.
3. **Analysis Run** — one deterministic analysis execution attempt bound to one
   exact Case revision. It has its own `run_id`, lifecycle, provenance and
   immutable terminal evidence. The one-active-Run rule is per Case revision.
4. **Assistance Attempt** — one optional external-model request initiated by a
   named user action. It is not an Analysis Run and cannot change calculation,
   Finding, report, Decision Closure, Case revision state or Analysis Run state
   merely by succeeding.
5. **Agent Runtime Session** — an implementation-private execution context
   opened through the business `AgentAnalysisRuntime` Port for a bounded
   Analysis Run or Assistance Attempt when that behavior is eligible.
   A Pi SDK session identifier, transcript or persistence type is never the
   Product Session identity or a public contract.

A Product Session may contain multiple preserved Case revisions. Each revision
may have zero or more Analysis Runs and Assistance Attempts. Every Analysis Run
or Assistance Attempt that uses an Agent Runtime binds to one Runtime, Adapter,
Profile and observed model identity for its complete lifetime. Restarting or
reopening the Product Session recovers the current Case revision and history; it
does not replay or revive a Pi SDK session.

## 2. First-slice persistent scope

The first real integrated path must provide:

- one real local Project context;
- creation of at least one professional Product Session with a stable identity
  and fixed professional mode;
- save, close and reopen of that Session without losing its current Case,
  approved data scope, Run history or report references;
- visible recovery treatment for interrupted or incomplete work without
  presenting it as successful;
- a stable association from every Analysis Run and Assistance Attempt to its
  Product Session and exact Case revision.

Quick mode remains visible under the accepted UI contract but may stay clearly
marked `Preview` until a later approved Change activates its real execution.
Fork, Subagent and a general Skill/Prompt runtime remain visible product
contracts, not claimed first-slice production behavior.

## 3. Session directory completeness contract

Each Product Session owns exactly these three user-meaningful directories:

```text
<project>/<session>/010_draw/
<project>/<session>/020_clean/
<project>/<session>/060_reports/
```

Their product meanings are:

| Directory | Product authority and boundary |
|---|---|
| `010_draw` | Imported raw source snapshots. Local deterministic processing may read them; they never become direct LLM input. |
| `020_clean` | Cleaned or aggregated, versioned outputs. Only a user-confirmed exact artifact subset may enter an assisted model request. Approval never silently expands to future artifacts. |
| `060_reports` | Versioned report outputs with draft, final and superseded state plus provenance back to the Case, Finding, Evidence and contributing Run or adopted child result. |

Creating a Product Session is successful only after its durable Session record
and all three directories are complete. Until then no Session may appear usable
or accept files, Runs or model requests. A failure must return one explicit
creation failure and leave no discoverable partial Session that can be mistaken
for success. Retry creates or completes one valid Session without merging with
an ambiguous partial identity. Exact staging, cleanup, quarantine and atomic
publication mechanisms remain Design decisions, but the externally observable
all-or-unavailable behavior is binding.

`060_reports` is the accepted name. `030_reports` is not an alias and must not
be introduced silently.

## 4. Run evidence stays separate

The existing `.xanthil/runs/<run_id>/` Run Artifact contract remains a reusable
execution-evidence boundary. It stores the Run manifest, confirmed Analysis
Contract, deterministic queries/scripts/outputs, Evidence and human
projections. It is not renamed into one of the three Session directories and
does not become the Product Session store.

The Product Session references Run identities and report provenance; it does
not duplicate immutable Run evidence or use a report filename as Run identity.
The exact operational index and filesystem projection require a later
structure decision and OpenSpec, while preserving current CLI compatibility.

## 5. Pi and model-call lifecycle

Phase 1 retains the Pi Adapter as the only active Agent Runtime Adapter. Product
Session creation performs no provider call, opens no Pi SDK session and does
not require a configured model.

The first slice has two explicitly different model-exposure classes:

| Assisted action | Eligibility and allowed payload | Forbidden payload |
|---|---|---|
| `帮我整理问题` on New Case or Confirm Plan | Product Session is usable; user explicitly invokes the action; the disclosure shows provider/model and the exact user-authored text, selected period labels and aggregate column names; user confirms the call and separately confirms free text may contain sensitive business content | Any `010_draw` data, raw row, file content, absolute path, member/order ID, original group value, credential, unselected log or automatically attached local file |
| `帮我解释证据` in Review or `帮我起草候选` after Finding acceptance | Required deterministic processing has produced a versioned `020_clean` artifact; the user confirms the exact artifact subset and payload categories; the action-specific Case/Finding guard from UI Contract v1.0 is satisfied | `010_draw`, unapproved or future `020_clean` artifacts, raw identifiers/files/paths, and any category not shown in the disclosure |

`帮我整理问题` therefore remains the previously accepted optional LLM action;
it does not require a `020_clean` artifact. Its permission is narrow: the lack
of raw-data attachment is a binding boundary, not an assumption that all
Product Session content is model-visible. The future requirements-interview or
research Demo may build on this capability only through a later approved plan;
it is not activated by this first-slice rule.

Every Assistance Attempt follows this lifecycle:

| Topic | Binding behavior |
|---|---|
| Identity | New product-owned `assistance_attempt_id`, action kind, Product Session ID and exact Case revision ID; it is not a `run_id` |
| Readiness | Exact disclosure/confirmation plus selected Desktop Profile Runtime/Adapter/model readiness; refusal creates no network activity |
| Concurrency | At most one active Assistance Attempt per Case revision; it cannot start while an Analysis Run is Running, and an Analysis Run cannot start while an Assistance Attempt is active |
| Runtime | Application may open one implementation-private Pi session for the bounded attempt; Pi session identity and transcript are not product authority |
| Success | Produce only the action's visibly labeled Draft; the user must explicitly edit, accept or decline it before any permitted form/report draft is updated |
| Failure or cancellation | Record terminal Failed or Cancelled attempt status with sanitized reason; preserve the current screen, Case revision, verified evidence, report and manual inputs; permit an explicit new attempt after a new disclosure |
| State effects | Never changes Analysis Run state, computed values, judgment, Finding acceptance, report authority, Decision Closure or Case revision state merely because the attempt succeeded, failed or was cancelled |
| History | Preserve action kind, payload-category disclosure, approval/refusal, Runtime/Adapter/model provenance, timestamps and terminal status in Case history; raw Pi transcript is not authoritative evidence and need not be replayed |

The deterministic manual path remains complete. Provider refusal,
unavailability, timeout, cancellation or model failure leaves the Product
Session usable without a false Finding, report or completion state. An Analysis
Run remains the authoritative computation attempt governed by the existing Run
state machine; an optional Assistance Attempt never occupies its identity or
one-active-Run slot.

The product contract does not hardcode Pi SDK types, a provider name or a model
identifier. Profile composition selects the supported Adapter and model. A
second Runtime, persistent Runtime-session recovery, registry, automatic
fallback, hot switching and universal Runtime abstraction remain separate
future Changes under ADR 0003.

## 6. Existing foundation versus first-slice delta

### Reuse without reopening accepted behavior

- Product Core, Application, Port, Adapter and Profile separation;
- the Pi-backed `AgentAnalysisRuntime` readiness, discovery, execution,
  cancellation, deadline, tool-policy and sanitized-failure behavior;
- DuckDB primary analysis and independent Python recomputation;
- UUID Run identity, local immutable Run artifacts and Run Evidence;
- source containment, checksums, atomic file publication, terminal
  immutability, provenance and fail-closed validation;
- the manual path when a model is not used or cannot complete.

### New Desktop behavior required

- durable Project and Product Session identity and lifecycle;
- the three-directory completeness boundary and raw/clean/report authority;
- real file import, immutable snapshot, cleaning/aggregation and explicit
  model-exposure approval;
- Desktop operational state and integrity recovery;
- Desktop composition Profile and versioned Renderer/Main/worker contracts;
- mapping Application progress, cancellation, errors, Run evidence and report
  state into the accepted Xanthil UI.

No empty `state-sqlite`, `llm` or other Adapter directory counts as an
implementation. Exact schemas, migrations, retention/deletion, resource
limits, IPC types and packaging belong to the later structure decision,
OpenSpec and Design.

## 7. First technical acceptance endpoint

Using the real macOS Desktop entry and approved first-slice fixture/data
boundary, a non-technical user can:

1. create one professional Product Session and see it only after
   `010_draw`, `020_clean` and `060_reports` are all ready;
2. import the approved local files into `010_draw` without model exposure;
3. produce and inspect the required deterministic `020_clean` aggregate;
4. optionally use `帮我整理问题` before aggregate creation with an exact
   text/category disclosure and proof that no `010_draw` data was sent;
5. either stay on the manual path or explicitly approve the exact aggregate
   subset for a later evidence/candidate Assistance Attempt;
6. complete the professional evidence/report/Decision Closure path;
7. close and reopen the Desktop and recover the Session, Case revisions,
   Analysis Run and Assistance Attempt references,
   evidence and report state without reviving a Pi SDK session; and
8. observe that directory failure, forbidden raw-data exposure, provider
   failure, cancellation or interrupted work never produces a false usable
   Session, Finding, final report or completed Case.

Acceptance requires real filesystem and process evidence through the public
Desktop entry. Demo state, fixture replay, mocked persistence and a running UI
alone do not satisfy it.

## 8. Required next Gate

Review 001 returned `NEEDS_CLARIFICATION` for the early-assistance prerequisite,
Session/Case revision authority and Assistance Attempt lifecycle. The user
resolved all three on 2026-09-18 through the rules now incorporated above. A
fresh Review 002 returned independent development-readiness `PASS` for the
complete Blueprint/UI package. A separate explicit user instruction may now
authorize the first production OpenSpec Change. The OpenSpec
must include an explicit structure decision before freezing persistent Session
schemas or filesystem contracts.
