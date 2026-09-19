# JuanerAI Product Brief

## Vision

JuanerAI helps data analysts and enterprise decision users move beyond static BI reporting into a traceable Data -> Decision -> Action -> Outcome loop.

## Product Family

JuanerAI is the commercial project family. Xanthil is its first product. Existing features and reusable Domain Packs, Model Packs, Runtime, data, semantic, asset and governance foundations remain available. The current development sequence is defined by the Blueprint v1.0 base and v1.1 correction package under `docs/planning/2026-09-18/`, grounded in JuanerAI Whitepaper v3.3.3.

## Users

- Data analysts investigating enterprise internal and external data.
- Enterprise users who use data to choose or authorize business action.

## Problem

Existing data products often stop at reports, metrics, dashboards, or analyst interpretation. The user must still translate observations into decisions, operational actions, and outcome learning.

## Product Hypothesis

A product grounded in an enterprise Ontology can connect evidence, business entities, decisions, authorized actions, and measured outcomes. AI can assist analysis and recommendation while policy and provenance keep the result accountable.

## Withdrawn First Product Direction — historical only

The following Desktop and Model Pack roadmap was made **VOID** by the user on 2026-09-18; see `docs/planning/README.md`. It is not pending execution. Existing accepted behavior, code and architecture remain protected; new requirements will drive bounded iterations rather than a restart.

Xanthil Desktop is the current product-development surface. It is a Data Analyst assistant whose required journey covers Data preparation, local cleaning/aggregation, Evidence-based Analysis (循证分析), report output, and execution feedback. A static product-manager Demo is reviewed before productization. The approved Pi-backed CLI local-analysis slice remains current executable evidence and an architecture reuse baseline, not the active roadmap entry.

## Asset and Model Capability Architecture

- Data and Ontology are foundational authorities.
- Hypothesis and Strategy are governed long-term assets.
- Domain Pack and Model Pack are executable capability packages.
- Knowledge and Memory are distinct background capabilities, not independent products.

The withdrawn plan sequenced Model Pack product work after Xanthil Desktop Data Analyst workflow acceptance. This sequence is historical, not a condition imposed on the forthcoming whitepaper-based plan.

## Historical Planned Scope — withdrawn

- Current CLI behavior and reuse boundaries remain protected.
- Local-first, enterprise-ready boundaries.
- Xanthil Desktop static Demo and product-plan approval before implementation.
- Xanthil Desktop for macOS and Windows as the current product direction.
- Domain Pack and Model Pack concepts as reusable capability boundaries.

## Historical Planned Non-Goals

- Product implementation before the static Demo, productization decisions, a fresh approved OpenSpec Change, and TDD Gates.
- Continued CLI feature development or CLI/Desktop parity.
- Enterprise deployment implementation.
- Generic BI dashboard or data-screen reproduction.
- Unsupervised real-world action execution.
- Final database, package, API, Ontology, asset, Knowledge, Memory, or model schemas.
- Premature microservices, Kubernetes, or multi-repository extraction.

## Current Direction and Gate

Current return point: Mini adopted `944bbcdbd07a2677b2d8354d9666dea3c070de0f`
and reported P4 PASS after the delegated Run adaptation. Product Test then
stopped on a correction-budget overrun and incomplete test quality; an affected
Spec revision is not yet approved and TDD_READY/Worker remain locked. The user
approved [Test Recovery Amendment 001](../planning/2026-09-19/xanthil-desktop-test-recovery-amendment-001.md):
one targeted Spec closure, one complete fresh-context Test batch and at most two
additional correction rounds, preserving failure history and prior stages.
MacBook verified the frozen index and 31 files/copies, not full product quality.
Manual intake by the original task is pending. Standing technical delegation,
product/UI meaning, compatibility and safety boundaries remain unchanged; this
does not reset old budgets or authorize Worker before TDD_READY. The chronology
below is retained history.

The user approved JuanerAI Product Development Blueprint v1.0 on 2026-09-18. The first vertical slice is a UI-first Xanthil Desktop Free membership-repurchase diagnosis Decision Case for non-technical users. The later v1.1 correction keeps this value endpoint but requires direct reuse of the accepted PX-2026-004 professional mode and PX-2026-006 quick/dual-mode product UI, including the visible Skill, Prompt, Fork, Subagent, report, Inspector/drawer and Session-navigation modules.

The earlier UI Contract v1.0 Review 002 `PASS` became historical after the user corrected its incomplete Xanthil UI adoption boundary. The current Blueprint/UI Contract v1.1 package, full adoption map, state/closure matrix and self-contained visual plates received fresh Review 005 `PASS`; the user accepted the directly reused PX-2026-004/006 clickable UI on 2026-09-18. That UI Gate acceptance freezes the product-mode reference but does not claim real Session persistence, filesystem creation, Runtime/provider execution, or authorize production OpenSpec, implementation, dependencies, real provider calls, real data, user research or release.

The user subsequently retained `060_reports` and accepted the first-slice Session/Runtime boundary. Product Session creation completes `010_draw`, `020_clean` and `060_reports` before becoming usable and performs no model call. Fresh [Session/Runtime Development-Readiness Review 001](../planning/2026-09-18/reviews/session-runtime-development-readiness-review-001.md) returned `NEEDS_CLARIFICATION`; the user then resolved all three gaps: `帮我整理问题` remains an LLM action with an exact disclosed text/label/column-name payload but no `010_draw`; one first-slice professional Product Session contains one Decision Case and Case revision is the only business revision; optional Assistance Attempts are separate from Analysis Runs and never mutate authoritative state merely by settling. The corrected binding details are in [Xanthil Desktop Session and Runtime Boundary v1.0](../planning/2026-09-18/xanthil-desktop-session-runtime-boundary-v1.0.md). Fresh [Review 002](../planning/2026-09-18/reviews/session-runtime-development-readiness-review-002.md) returned `PASS`. On 2026-09-19 the user authorized the first production OpenSpec Change and the preparation and transfer of [Execution Package v1.0](../planning/2026-09-19/xanthil-desktop-first-product-change-execution-package-v1.0.md). Mac mini returned formal Spec drafts and stopped before Spec Gate for dependency decisions. The user approved all twelve items of the [overall dependency/structure decision package](../planning/2026-09-19/xanthil-desktop-dependency-structure-decision-v1.0.md), including bounded preparation permissions. Mini adopted the dependency decision and then [Toolchain Amendment 001](../planning/2026-09-19/xanthil-desktop-toolchain-amendment-001.md) at `ebbd16bc9f883a914b8b91f0d31947d11e0ef3fe`, retaining Stage 0/1 PASS and all drafts. Task-local tool preparation and independent health readback passed. The preceding stop was `DEPENDENCY_PREFLIGHT_BLOCKED_P1`: the coordinator assigned the same file to npm user/global configuration, causing config loading to fail before dependency resolution. Formal Spec stopped without file edits; P2/P3 and Spec Gate have not run. The user then authorized [P1 Config Retry 001](../planning/2026-09-19/xanthil-desktop-p1-config-retry-001.md): two distinct empty task-local configs, a no-install configuration check and one retry of the original P1 command, preserving existing candidate and failure evidence. That supplement was published for manual forwarding to the original task; its pending retry status is superseded below. The accepted WIP disposition is not replayed. See the planning index for current authority and evidence limits.

Preceding handoff: Mini received `e93acbfcaf29adf112f6b8ff73668428a55d94cc`; configuration precheck and the sole P1 retry exited 0. Review of the generated lock stopped on the fixed Electron node-gyp Git source, whose HTTPS archive npm had already downloaded outside the then registry-only boundary. The user approved [Source and Execution Amendment 001](../planning/2026-09-19/xanthil-desktop-source-and-execution-amendment-001.md), covering only that exact source and bounded development-execution self-correction. After that intake Mini resumed the existing lock review; P1 review, P2/P3 and Spec Gate are not yet PASS. This changes neither the product retry policy nor its UI, data, role or acceptance boundaries.

Preceding handoff: Mini received `0b75194d1646b20b1c087863570009431d9e22ea`, matched the source exception and stopped before P1 PASS on six baseline Pi child-package integrity omissions. The user approved [Baseline Integrity Amendment 001](../planning/2026-09-19/xanthil-desktop-baseline-integrity-amendment-001.md): verify the six exact 0.84.2 archives and add only their integrity fields to the isolated candidate lock. All versions, sources and dependency relationships stay fixed; repository lock adoption remains at P4. Archive verification and the later Gates await Mini evidence. This is not a new product plan or a validation waiver.
