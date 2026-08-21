# Xanthil CLI Local Analysis Slice — Exploration

## State

- Change: `CHG-xanthil-cli-local-analysis-slice`
- Workflow state: `EXPLORE`
- Date: 2026-08-20
- Authority: user approval of `XCLI-INTAKE-001`
- Delivery path: `greenfield_fast_path`

## Product Finding

The detailed product plan establishes Xanthil CLI as a professional data-analysis Agent for data analysts who already use SQL, Python, and terminals. The full v0.1 direction contains an interactive Analyst Assistant, three automated Analysis Workflows, local data tools, Evidence, and Artifacts.

The first Change must not attempt the full v0.1. The approved first slice is the smallest Assistant-only path that can prove a user can move from a deliberately vague business question to a reproducible local analysis result.

## Approved First Slice

The user enters a workspace containing a non-sensitive synthetic member dataset, starts `xanthil`, and asks whether recent member operations show a problem. Xanthil must:

1. narrow the question into an Analysis Contract before execution;
2. inspect only the approved local dataset;
3. use controlled read-only analytical execution;
4. validate calculations and surface uncertainty;
5. write a traceable Summary, Evidence, executed analysis assets, and a versioned run record.

The fixture-specific metric meanings and expected results will be frozen in the Specification. They are test semantics, not invented claims about a real business.

## Product Semantics

- The accountable user is a Data Analyst.
- The output is an evidence-backed analytical finding, not a `Decision`, `Action Recommendation`, `Action`, or `Outcome` as defined by `CONTEXT.md`.
- The first slice proves the Pi-backed Assistant loop and reproducibility contract.
- Daily-use quality, external research, real-enterprise-data safety, automated Workflows, and business action usefulness remain learning objectives or later Changes.

## Repository and Architecture Findings

- `docs/adr/0001-modular-monorepo.md` keeps Xanthil in the JuanerAI modular monorepo. The product plan's proposed independent `xanthil-cli` repository is therefore deferred.
- The CLI belongs under `apps/cli/` and calls Application behavior.
- Pi must remain behind `adapters/agent-pi/`; Product Core and Application cannot import Pi SDK types.
- The personal composition root belongs under `profiles/personal/`.
- Local analytical execution and local Artifact storage are separate capabilities. SQLite operational state is not needed for this slice.
- Any durable `.xanthil/runs/` layout or run manifest is a closed persistent contract and requires structure review before implementation.

## Local Pi Evidence

Read-only discovery found:

- executable: `/Users/huangbo/Dev/Env/npm-global/bin/pi`
- resolved executable: `/Users/huangbo/Dev/Env/npm-global/lib/node_modules/@earendil-works/pi-coding-agent/dist/cli.js`
- package: `@earendil-works/pi-coding-agent`
- version: `0.84.2`
- engine declaration: Node.js `>=22.19.0`
- local Node.js: `v26.0.0`

The installed Pi package exposes:

- TypeScript SDK entrypoints including `createAgentSession`, `ModelRuntime`, `SessionManager`, custom tools, resource loading, event subscriptions, and abort;
- CLI Extension, Skill, prompt-template, tool allowlist, session-directory, offline-startup, print, JSON, and RPC surfaces;
- `--no-builtin-tools` plus an explicit allowlist for narrow Xanthil tools;
- in-memory sessions, so Pi persistence need not define Xanthil run persistence.

This is sufficient evidence that a no-fork Pi Adapter is feasible at the API-shape level. No model call, dependency installation, credentials read, or runtime product proof was performed during Explore.

## Local Data Runtime Evidence

- DuckDB CLI: `v1.5.2`
- Python: `3.9.6`
- Python packages present: `pandas`, `duckdb`, `openpyxl`
- Python package absent: `pyarrow`

Installed tools are environment evidence only. They are not yet approved product dependencies or version contracts.

## Pi Integration Decision Point

Two public integration surfaces are viable:

1. SDK embedding in the TypeScript CLI.
2. Spawning `pi --mode rpc` as an Adapter subprocess.

SDK embedding is the current recommendation because the first product surface is a Node.js/TypeScript CLI and the SDK directly exposes custom tools, abort, event streaming, resource isolation, and in-memory sessions. Production use still requires an approved, pinned project dependency; the global installation is not a reproducible application dependency.

RPC remains the rollback option if SDK packaging, version compatibility, or process isolation evidence makes embedding unsuitable.

## Data and Security Boundary

- Only a repository-owned non-sensitive synthetic fixture is in scope.
- The selected external model may receive this fixture, its schema, derived values, prompts, and tool results for this slice.
- Provider and model identity must be recorded without recording credentials.
- Real user data, enterprise data, secrets, external databases, Web Research, arbitrary network access, and data upload tools are forbidden.
- Pi runs with the local user's OS authority and is not treated as a security boundary.
- Tool capability must be narrow; generic Pi write/edit/bash tools are not automatically exposed to the model.

## Environment Issue

Pi `0.84.2` currently warns that configured model pattern `kimi-coding/k2p7` matches no available model. Available model discovery succeeds, but authentication and a real model call were deliberately not tested. Runtime verification must select an explicit available model without silently rewriting the user's global Pi settings.

### Resolution

After the user explicitly requested the environment change, the global Pi settings were updated to `defaultProvider=xiaomi-token-plan-cn` and `defaultModel=mimo-v2.5-pro`; the invalid `kimi-coding/k2p7` enabled-model entry was removed. Offline model discovery finds the target and `pi auth check --no-refresh` reports `ready`. No model call was made.

## Risks and Unknowns for Specification and Design

1. Exact Analysis Contract fields and confirmation behavior.
2. Exact synthetic fixture, member metric definitions, reference results, and tolerance.
3. SDK dependency/version authorization and project package-manager choice.
4. Tool execution boundary: dedicated analytical tools versus a narrowly constrained subprocess tool.
5. Closed Artifact/run manifest structure, partial-output behavior, retention, and collision handling.
6. Cancellation and model/tool failure mapping into user-visible run states.
7. Explicit model selection and authentication readiness for real integration evidence.
8. How much source data is included in model messages versus retained behind tools, even for later non-synthetic datasets.

## Explore Exit

The affected product boundary, local runtime capability, safety boundary, and unresolved contract decisions are understood well enough to create the Proposal. No product implementation is authorized by this document.
