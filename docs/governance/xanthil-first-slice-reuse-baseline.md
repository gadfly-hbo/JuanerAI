# Xanthil First-Slice Reuse Baseline

Read this before proposing a new Xanthil capability, Adapter, runtime, surface, or refactor. Current observable behavior remains authoritative in `openspec/specs/local-analysis/spec.md`; this document explains what later work should reuse and what requires an explicit delta.

## Current Authority

| Concern | Authority |
|---|---|
| observable local-analysis behavior | `openspec/specs/local-analysis/spec.md` |
| architecture and dependency direction | `AGENTS.md` and `docs/architecture/` |
| TypeScript-first direction and current exception | `docs/adr/0002-typescript-first-language-strategy.md` |
| complete first-slice decision and evidence history | `openspec/changes/archive/2026-08-21-xanthil-cli-local-analysis-slice/` |
| executable behavior | `tests/` and current production modules |

Do not copy archived intermediate revisions into a new Change. Start from the current spec and current executable baseline.

## Reusable Architecture

- Product Core owns closed business values and validation without SDK, filesystem, database, subprocess, Profile, or CLI dependencies.
- Application owns use-case sequencing, business-oriented Port calls, run semantics, cancellation/deadline admission, and the semantic result.
- Ports expose Agent Analysis Runtime, Local Analysis Execution, and Run Artifact Store capabilities.
- Pi, DuckDB/Python, filesystem, and future infrastructure remain concrete Adapters.
- The personal Profile is the composition root; CLI is a surface over Application.
- Application is the single semantic writer. Adapters implement physical operations but do not invent business status, provenance, or terminal meaning.

New work extends these boundaries only through an approved contract delta. It does not reintroduce generic shell, SQL, Python, HTTP, filesystem, or SDK types into Core/Application.

## Reusable Executable Assets

| Asset | Path | Reuse |
|---|---|---|
| current capability spec | `openspec/specs/local-analysis/spec.md` | baseline behavior and non-goals |
| fixture and exact oracle | `tests/fixtures/xanthil-local-analysis/fixture-oracle.mjs` | deterministic source identity, proposal, finding, and metric values |
| coverage mapping | `tests/fixtures/xanthil-local-analysis/coverage-map.mjs` | AC-to-test completeness checks |
| Port contracts and doubles | `tests/fixtures/xanthil-local-analysis/port-contracts.mjs` | shared Adapter contract drivers, deterministic sessions, analysis and artifact doubles |
| CLI/Profile harness | `tests/fixtures/xanthil-local-analysis/cli-profile-harness.mjs` | structured input/output and lifecycle doubles |
| public seams | `tests/fixtures/xanthil-local-analysis/public-seams.mjs` | exact approved module entrypoints |
| Pi failure fixtures | `tests/fixtures/xanthil-local-analysis/pi-sdk-failure-*.mjs` | import/runtime/refresh/model classification without provider calls |
| contract suite | `tests/contract/xanthil-local-analysis/local-analysis-ports.contract.test.mjs` | every replaceable Adapter implementation |
| integration suite | `tests/integration/xanthil-local-analysis/local-analysis.integration.test.mjs` | Application sequencing, physical Adapters, virtual deadline and cancellation races |
| E2E suite | `tests/e2e/xanthil-local-analysis/local-analysis.e2e.test.mjs` | CLI/Profile journey and gated real-model proof |

Reuse these assets by adding a bounded leaf or new contract implementation. Broad rewrites require an explicit behavior or test-architecture delta.

## Frozen Baseline Decisions

Ordinary Xanthil features do not reopen these decisions:

- explicit `minimax-cn/MiniMax-M3` for the archived personal-profile behavior, with no fallback;
- Pi behind the Agent Runtime Adapter rather than inside Product Core or Application;
- one in-memory Discovery/Execution session with approved business tools only;
- exact source preflight before external/model effects and a physical recheck before analytical read;
- requested configuration and observed runtime/model/tool state are distinct;
- `in_progress`, `succeeded`, `failed`, and `cancelled` are the closed run states;
- stable failure vocabulary distinguishes runtime initialization, model selection, source mutation, timeout, validation, analysis, tool, and artifact failures;
- 300-second absolute attempt deadline, 30-second analytical budgets, no product retry, and no hidden repair;
- user cancellation closes future normal admission while deadline remains the absolute winner;
- success linearizes only at final succeeded `run.json`; candidate evidence/Markdown is not success;
- terminal files are immutable and rollback/retirement never rewrites user-owned runs;
- the synthetic fixture, raw rows, credentials, provider payloads, transcripts, and unrelated workspace content remain within their approved boundaries;
- project subagents dispatch automatically only at their lifecycle Gates under the standing authority in `AGENTS.md`.

A future Change may replace a decision, but it must name the current contract, the intended delta, compatibility, activation, rollback, tests, and affected consumers.

## Slice-Specific Facts That Are Not Global Product Assumptions

- The repurchase-member metric, date windows, fixed question, one CSV fixture, one Finding, and exact asset inventory belong to this capability slice.
- The personal Profile's trusted-local Pi boundary is not an enterprise isolation or permission model.
- The `.mjs` zero-compiler stack is the archived first-slice exception, not the long-term JuanerAI language default.
- One real-model PASS proves this integration path under the approved gate; it is not a general reliability SLA.
- No Decision, Action Recommendation, automated Action, Workflow, Desktop, Console, multi-user, retention, deletion, or repair behavior is implied.

Do not promote these facts into reusable platform promises without a new approved Change.

## New-Change Intake

Before dispatching Spec, record:

1. Which current Requirements, Ports, tests, fixtures/doubles, errors, and Profiles are reused unchanged?
2. What single user-observable delta is proposed?
3. Does the delta change persistence, identity, version, model/runtime, data source, egress, permission, timeout, cancellation, atomicity, or terminal behavior?
4. Which existing contract suites must remain unchanged and which new leaves are needed?
5. Does any existing test need modification? If yes, what approved behavior changed?
6. Is a known working reference repository available, and which assumptions are transferable?
7. Is the Change ordinary, boundary-changing, or foundation/bootstrap under `docs/governance/change-complexity-control.md`?

The intake is complete when the reused baseline and intended delta are both explicit. “Use the existing architecture” without naming the reused contracts is insufficient.

## Expected Ordinary Feature Shape

An ordinary business feature should normally add a small spec delta, targeted tests, one bounded implementation, affected contract regression, and independent validation. It should not reselect the language, Pi integration mode, model identity, run root, error taxonomy, Artifact lifecycle, subagent authority, or full test harness.

If that expectation fails, stop at the complexity line and determine whether the work is actually a boundary Change or whether the existing baseline was not reused correctly.
