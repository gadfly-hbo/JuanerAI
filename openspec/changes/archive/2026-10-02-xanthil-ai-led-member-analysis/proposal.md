# Change004 — AI-led membership analysis

Status: decisions001–003 applied; B membership path connected offline. Decision004 closes the retained-entry contract; its consumer implementation remains outstanding (2026-10-02).
Current scope and evidence: [verification](verification.md). A/P1 remains incomplete.
Author: configured `juaner_worker`, gpt-6-astra/high/workspace-write; runtime
identity independently attested by the parent as recorded in [intake](intake.md).
This document does not record a Controller decision or product acceptance.

## Authority and intended result

Adopt execution policy v0.8, Blueprint v4.1 and the approved P1 product/UI package
bound by [intake](intake.md). Its current-user instruction releases preparation-only
and human-baseline startup stops. Human experience review remains the user's later
work; no UX targets, observations or acceptance are fabricated.

One Change delivers **A then B**: a Personal user provides a membership question
and two authorized CSVs; the system consumes an explicit scenario version and
bounded plan, calculates and independently verifies results, presents a verified
finding and report, handles comments/period changes, and records one explicit
human review outcome. A alone does not complete P1.

Normative inputs:

- [Stage plan](../../../../docs/planning/2026-10-01/xanthil-ai-led-analysis-stage-product-plan-v0.1.md), P1-R01–05 and T1–T4.
- [Decisions](../../../../docs/planning/2026-10-01/xanthil-ai-led-analysis-product-decisions-v0.1.md), D1–D6 and activation constraints F1/F2/F4.
- [Acceptance](../../../../docs/planning/2026-10-01/xanthil-ai-led-analysis-acceptance-and-coverage-v0.1.md), SC-01–12, CAP-01–09; UX remains separately unverified.
- [UI Contract](../../../../docs/planning/2026-10-01/xanthil-ai-led-analysis-ui-contract-v0.1.md), UI-P1-01–13, approved attachment and Chinese-first copy; [approval](../../../../docs/planning/2026-10-01/xanthil-ai-led-analysis-approval-and-handoff-v0.1.md) and [Review003](../../../../docs/planning/2026-10-01/reviews/xanthil-ai-led-analysis-development-readiness-review-003.md).

## Reuse and concrete gaps

Preserve accepted [Desktop](../../../specs/xanthil-desktop-decision-case/spec.md),
[Assistant](../../../specs/case-assistant/spec.md), [collaboration](../../../specs/case-collaboration/spec.md)
and CLI/local-analysis behavior. Current code provides real snapshot qualification,
two independent algorithms, immutable run/report files, SQLite receipts, human
Finding/Closure/Decision authority, Pi transport, model settings and one model lease.

Initial pre-implementation gaps (now covered by the connected loops below):

1. `desktopConfirmationDocuments` writes fixed steps; Application passes selection
   fields to calculation but does not consume those IR steps. DuckDB always includes
   group aggregation; Python chooses it from mapping. Neither is plan-driven M1-only.
2. Old zero-active results use `0/1`; P1 requires an unavailable rate and rate delta.
3. Completed-only Assistant cannot coordinate an unfinished task. Its usage belongs
   to an Attempt, without the new durable cumulative task grant/reservation chain.
4. Finding acceptance/Closure reside in `state.sqlite`; formal Assistant decisions
   and their reports reside in `case-assistant.sqlite`. Calling the old commands in
   sequence cannot implement P1's combined human-review commit.

[Design](design.md) names exact seams and six concrete decisions C1–C6. No second
Runtime, generic scheduler, semantic platform or new database engine is proposed.

## Delivery increments

| Increment | Result and acceptance | Remaining work |
| --- | --- | --- |
| A first loop | Explicit bounded plan through real DuckDB/Python and Application/Store to a verified draft report, with same-plan identities and refusal before effects; SC-02/05/07, CAP-01–03/06 | Task model coordination and integrated UI still pending |
| A integrated | Empty task → minimal clarification/authorization → bounded coordination → early verified finding/first report; persistent consumption, Stop and reopen without execution; SC-01/02/05–10, CAP-01–05/08/09, UI-01–06/08–10 | B now connected offline; native verification remains unresolved |
| B integrated | Version-bound comments, expression-only revision, lawful new periods, recovery and three human-review exits; SC-03/04/11/12, CAP-06–09, UI-07/11–13 | Decision004 retained-source consumers remain unfinished; native and user experience remain unverified |

The first loop is an early real consumer inside A, not a separately delivered
Analysis Core. No mock report or fixed reply substitutes for computation or AI quality.

## Scope and dependencies

Allowed: this Change; `packages/{product-core,application,ports,contracts}/`,
`adapters/{analytics-duckdb,storage-local,agent-pi}/`, `profiles/personal/`,
`apps/desktop/`, affected `tests/`, necessary `tools/desktop/` wiring.
Compiler/build wiring is conditional on an affected path, without dependency,
version or lockfile changes. Installed Node26/DuckDB/Python/Pi are reused.

Forbidden: frozen product/UI files, accepted/archive specs, Controller intake,
decisions and project-control, other writers' work, branch changes, Git delivery,
other agents/tasks, real Provider calls, credentials, installs, host changes,
business/user data, external publication, the blocked prototype or workarounds.
No Actual, action execution, learning, OSM/Team/Enterprise, Pack activation,
arbitrary filtering/SQL/Shell/Web, concurrent/recursive agents or fallback.

Important contracts C1–C6 require Mini's in-boundary decision before their dependent
implementation. Private helpers/fixtures do not require per-command approval.
Resource profiles require explicit values and approval identity; unconfigured or
unapproved real activation rejects. No production resource values or small-group
thresholds are supplied. Synthetic values remain test-only.

## Blueprint coverage and evidence limit

Expected increments: C1-01/03, C2-01, C3-01/04, C4-01/02, C5-01/02/09, C6-01,
A-01–05, B-01–03. Preserve accepted C5-03/04/08 and their exact eligibility;
this proposal claims no newly delivered capability. C4-07 only supplies current
scenario reuse, not a new Pack. The full 40-ID product register remains Mini-owned.

Value hypothesis: less mechanical assembly, correct reusable methods and exact
history. First/repeated-task effort, understanding and comparative value require
later evidence; offline mechanism tests cannot establish these claims. After P1,
return to outcome follow-up and explicit next-Case adoption under later authority.

Historical design baseline: 12 existing focused tests passed before implementation.
Current code/RED/GREEN and remaining gaps are recorded in [verification](verification.md).
No Engineering Acceptance, independent Validator verdict or user Product Acceptance
is claimed.

## Current material return point

[Completed-source impact brief](contract-impact-p1-completed-source.md) records an
actual synthetic Pi request through retained Assistant after C6 completion, carrying
M2 groups and using a separate Attempt budget. This is not a final integrated P1
candidate or acceptance. Preserve source eligibility; Decision004 pins the same task ledger and separate
explicit retained-entry grants. Its actual consumers now use distinct explicit grants in the original ledger;
positive main/child/adoption and negative material/usage tests are recorded in verification.
No native retry is implied.
