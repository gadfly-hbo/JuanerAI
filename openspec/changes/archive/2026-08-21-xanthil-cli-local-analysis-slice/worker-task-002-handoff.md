# Worker Handoff — TASK-002

## Change and Goal

- Change: `CHG-xanthil-cli-local-analysis-slice`
- Task: `TASK-002`
- Requirements: `REQ-XCLI-003`, `REQ-XCLI-004`, `REQ-XCLI-005`, `REQ-XCLI-009` through `REQ-XCLI-012`, `REQ-XCLI-015`, `REQ-XCLI-016`
- Gate input: Controller final `TDD_READY` recorded in `verification.md` on 2026-08-20
- One concrete outcome: implement the infrastructure-independent Product Core and closed contract rules required to turn the frozen unit target from RED to GREEN, without implementing Application, Ports, Adapters, CLI, Profiles, manifests, or dependencies.

## Non-Goals

- Do not implement `TASK-003` or later behavior.
- Do not edit tests, fixtures, approved OpenSpec, architecture/governance, project-control, READMEs, manifests, lockfiles, or global Pi state.
- Do not import Pi, DuckDB, Python, filesystem/process/network SDKs, or TypeBox. TypeBox is optional in the approved task and remains unavailable until dependency authorization.
- Do not add test-only exports, test modes, inspector/verifier APIs, fault switches, ambient defaults, retries, migrations, or compatibility behavior.

## Boundary

- Domain: Product Core / infrastructure-independent contracts
- Allowed paths:
  - `packages/product-core/**`
  - `packages/contracts/**`
- Conditional paths: none
- Forbidden paths: all tests; `openspec/**`; `.juanerai/**`; `packages/application/**`; `packages/ports/**`; all `adapters/**`; `apps/**`; `profiles/**`; examples; root manifests/lockfiles; global files; other repositories

## Frozen Inputs and Public Surface

- Read and follow `AGENTS.md`, `CONTEXT.md`, `design.md`, `tasks.md`, `verification.md`, `test-plan.md`, and the frozen tests under `tests/unit/xanthil-local-analysis/**` plus test-private fixture helpers.
- Public entry module: `packages/product-core/local-analysis.mjs`.
- It exports only `createLocalAnalysisDomain()` for this task. The returned deep module supplies the real pure rules and closed-contract operations consumed by future Application code. It must not expose test drivers or infrastructure types.
- The canonical fixture, SHA-256, windows, exact rational oracle, Finding limitations, Run/Evidence closed schemas, stable error vocabulary, and Markdown authority rules are normative in the approved Spec/Design.

## Pre-Code Constraint Matrix

Before editing, send the Controller a concise acknowledgement of this matrix and stop if any row cannot be implemented without changing a test or approved contract.

| Brief bullet | Invariant family | Authority | Planned implementation | Positive evidence | Negative evidence | Waiver/blocker |
|---|---|---|---|---|---|---|
| exact fixture and oracle | source identity / calculation | Spec fixture + REQ-004/005 | Product Core pure bytes/parser/rational rules | TEST-001 exact result | mutation, malformed schema/date/order ID, caller-metric rejection | none permitted |
| bounded Finding | domain interpretation | REQ-005/011/012 | pure Finding/result validator | TEST-002 supported Finding | missing limitations, causal/significance/impact/recommendation/Action, equality/zero denominator | none permitted |
| closed Run Manifest | durable contract | Design Run Manifest + REQ-003/009/010/016 | closed status-discriminated validator | TEST-004 in-progress record | unknown/missing/null/version/status-invalid shapes | none permitted |
| Evidence integrity | durable references / provenance | Design Evidence + REQ-011/012/015 | closed Evidence and catalog reference/checksum validator | TEST-005 valid same-run chain | duplicate/dangling/foreign/checksum mismatch | none permitted |
| tool/data boundary | permission / egress | REQ-004/006/014 | pure least-capability request policy | TEST-014 approved tool | generic tool, arbitrary SQL/Python, path escape | none permitted |
| terminal outcomes | lifecycle / failure | REQ-010/013 | closed failure/cancel/no-retry validator | TEST-015 stable failed/cancelled result | retry/success misuse and invalid budget | none permitted |
| offline reproduction | provenance / reproducibility | REQ-011/012/015 | verified fixture identity + deterministic pure calculation | TEST-017 exact oracle | hash mismatch or session/narrative authority | none permitted |
| Markdown projection | derived view | REQ-012 | compare human projections to authoritative structures | TEST-018 exact projection | number/status/limitation/reference drift | none permitted |

## Implementation Constraints

- Use JavaScript ESM `.mjs`, Node built-ins only, no install/build step.
- Closed production interfaces reject unknown/proof-only fields; silently ignoring extra fields is failure, not compliance.
- Expected values must be computed from authoritative fixture bytes/window definitions, not returned from caller-provided metrics or imported from test helpers.
- Exact rational arithmetic is authoritative; format one-decimal percentages only at the projection boundary.
- Preserve Product Core independence: no paths resolved against the OS, no file reads/writes, no clocks, no environment access, no SDK/process handles.
- Errors may use stable `Error.message`/code text required by tests and approved error vocabulary; do not leak raw infrastructure details.
- Tests are frozen. A necessary test correction is a `TEST_CONFLICT` returned to Controller, never a Worker edit.

## Agent Route

- Role: JuanerAI implementation Worker
- Risk: R2
- Difficulty: complex
- Model: `gpt-5.6-terra`
- Reasoning effort: high
- Routing rationale: this batch implements closed persistent contracts, exact provenance/reference rules, failure semantics, and security negatives across Product Core concerns, but has no external writes or irreversible effects.
- Upgrade trigger: concrete evidence that the approved contract interactions cannot be satisfied at Terra/high; missing authority or dependency is a blocker, not an escalation reason.
- Override duration: this single TASK-002 dispatch through GREEN, BLOCKED, TEST_CONFLICT, or ROUTING_ESCALATION_REQUIRED.
- Rollback to role default: after return; no silent retry or mid-run model switch.

## Write and Validation Budget

- `write_risk`: medium — ordinary source implementation in at most the two allowed module trees; no DB, cache, build, install, model, network, bulk fixture, or watcher activity.
- CLI self-write risk: report any observed session/history/log/trace/tmp growth; do not create retained evidence artifacts.
- Start with path-limited `rg --files` and the named tests/contracts; the current repository is not indexed in `codebase_memory`, so use the frozen paths and `rg` rather than indexing or exploring another project.
- Allowed validation:
  - `node --check packages/product-core/local-analysis.mjs` after creation/change;
  - `node --test tests/unit/xanthil-local-analysis/*.test.mjs` at most three total Worker executions, including the final GREEN run;
  - path/forbidden-import `rg` checks limited to the allowed production paths;
  - no contract/integration/E2E/full-repository test run in this batch.
- On a failing unit run, inspect the exact failure and change code before another run; do not consume runs by retrying unchanged code.

## Handoff Back

Use `docs/templates/HANDOFF_BACK.template.md`. Report the pre-code constraint acknowledgement, changed files, each matrix row's positive/negative evidence, exact validation commands with run counts/results, public exports, forbidden-import/path scan, contract drift, write-risk/CLI-write observations, risks, and unverified later tasks. Return GREEN only if the frozen unit target passes without test changes.
