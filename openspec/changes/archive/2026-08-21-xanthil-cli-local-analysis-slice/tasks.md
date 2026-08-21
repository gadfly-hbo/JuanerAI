# Tasks: Xanthil CLI Local Analysis Slice

## Gate and Path Rules

Task state is recorded by Controller verification evidence, not inferred from this plan. TASK-007 and its project-local stack are accepted; remaining or revised work still requires its applicable Gate and this file alone is not implementation authority.

- Test tasks may begin only after Controller Spec Gate PASS and belong to `juaner_test`.
- Production tasks may begin only after executable tests establish `EXPECTED_RED` and the Controller records `TDD_READY`; they belong to `juaner_worker`.
- Tests and production implementation remain logically isolated.
- The accepted TASK-007 first stack is frozen as root private ESM `package.json` plus `package-lock.json`, npm `11.12.1`, production `.mjs`, Node built-in tests, exact direct dependencies `@earendil-works/pi-coding-agent@0.84.2` and `typebox@1.3.7`, DuckDB CLI `1.5.2`, and Python `>=3.9` standard library. No repeat installation or manifest/lock/dependency mutation is authorized; any future change requires separate authority.
- No task may write global Pi configuration, credentials, project-control state, shared architecture/glossary, another Change, Desktop, Console, enterprise, or external-repository paths.
- Contract or structure drift stops the dependent task and returns to the Controller; Workers do not add fields, enums, defaults, tools, paths, statuses, dependencies, or behavior.

## Planned Tasks

### TASK-001 — Derive Executable Tests and Establish RED

- Role: Test
- Requirements: `REQ-XCLI-001` through `REQ-XCLI-016`
- Planned tests: `TEST-XCLI-001` through `TEST-XCLI-022`
- Allowed writes: `tests/unit/xanthil-local-analysis/**`, `tests/contract/xanthil-local-analysis/**`, `tests/integration/xanthil-local-analysis/**`, `tests/e2e/xanthil-local-analysis/**`, and test-private synthetic fixtures under `tests/fixtures/xanthil-local-analysis/**`
- Forbidden: all production paths and approved OpenSpec files
- Work: using Node's built-in `node:test` runner and JavaScript `.mjs` test files, encode the exact fixture/oracle, positive and negative AC behavior, three replaceable Port suites, integration and E2E intent; prove the test environment is healthy and failures are caused by absent behavior.
- Exit evidence: AC-to-test inventory, commands, healthy baseline, `EXPECTED_RED`, and no weakened assertion or missing negative case.

### TASK-002 — Implement Infrastructure-Independent Contracts and Rules

- Role: Worker after `TDD_READY`
- Requirements: `REQ-XCLI-003`, `REQ-XCLI-004`, `REQ-XCLI-005`, `REQ-XCLI-009` through `REQ-XCLI-012`, `REQ-XCLI-015`, `REQ-XCLI-016`
- Planned tests: `TEST-XCLI-001`, `TEST-XCLI-002`, `TEST-XCLI-004`, `TEST-XCLI-005`, `TEST-XCLI-018` through `TEST-XCLI-020`
- Allowed writes: `packages/product-core/**`, `packages/contracts/**`
- Forbidden: tests, adapters, CLI, profiles, the frozen root manifests/lockfile, and all documentation paths
- Work: implement closed version `1.0` value validation, exact fixture/repurchase oracle, Finding/evidence rules, status union, ID/reference/checksum validation, and stable error vocabulary without infrastructure imports. `packages/contracts` may use exact `typebox@1.3.7` runtime schemas; TypeBox schema objects do not become Product Core or Port values.
- Exit evidence: mapped unit tests GREEN; unknown fields/versions/enums and invalid states fail closed; dependency-direction check passes.

**Bounded TASK-002 proposal-validator revision prerequisite for TASK-006:** Test first extends only the existing TASK-001 unit ownership with `TEST-XCLI-003` validator leaves and establishes RED caused only by the absent `validateAnalysisProposal`. A Core-only Worker then modifies only `packages/product-core/local-analysis.mjs` to add that exact factory operation; Application, Ports, Adapters, CLI, Profile, examples, tests, manifests, and every other path remain frozen. GREEN requires the positive same-reference/non-mutation/no-freeze/no-default/no-I/O case and each independently scheduled closed-shape/semantic/version negative. Controller acceptance of this Core-only GREEN is required before the original TASK-006 Worker resumes; its original TASK-006 allowed paths and execution budget are preserved, not replaced or expanded.

### TASK-003 — Implement Business Ports and Application Use Case

- Role: Worker after TASK-002 evidence
- Requirements: `REQ-XCLI-001` through `REQ-XCLI-015`
- Planned tests: `TEST-XCLI-003`, `TEST-XCLI-006` through `TEST-XCLI-010`, `TEST-XCLI-015` through `TEST-XCLI-019`
- Allowed writes: `packages/application/**`, `packages/ports/**`
- Forbidden: tests, concrete Adapter SDK/engine/filesystem imports, CLI rendering, profiles, and documentation
- Work: implement preflight, Analysis Gate, one-session sequencing, UUIDv7 attempt creation, three-tool admission policy, single-writer commit order, timeouts, cancellation, error mapping, Evidence/Markdown finalization, and Port contracts.
- Exit evidence: Application tests and all deterministic Port doubles GREEN; no Pi/DuckDB/Python/filesystem type leaks into Application or Product Core.

### TASK-004 — Implement Local Analysis and Artifact Adapters

- Role: Worker after TASK-003 contracts freeze
- Requirements: `REQ-XCLI-003` through `REQ-XCLI-006`, `REQ-XCLI-008` through `REQ-XCLI-013`, `REQ-XCLI-015`, `REQ-XCLI-016`
- Planned tests: `TEST-XCLI-007`, `TEST-XCLI-008`, `TEST-XCLI-012`, `TEST-XCLI-014` through `TEST-XCLI-020`
- Allowed writes: `adapters/analytics-duckdb/**`, `adapters/storage-local/**`
- Forbidden: tests, Agent Adapter, CLI, profiles, the frozen root manifests/lockfile, and documentation
- Work: implement exact canonical repurchase SQL/Python operations, 30-second per-call deadline, cancellation, aggregate-only results, containment/collision checks, append-only numbered assets, atomic core writes, supported-version reads, terminal immutability, and sanitized error translation. Production JavaScript is `.mjs`; Python validation uses only Python `>=3.9` standard library.
- Exit evidence: the unchanged Local Analysis and Run Artifact Port contract suites pass against real Adapters; SQL/Python independently reproduce the oracle; crash/negative cases retain prior valid state.

### TASK-005 — Pi SDK Adapter (Accepted Deterministic Evidence)

- Role: historical Worker task accepted for deterministic evidence; TASK-007 established the separately authorized project-local dependency stack, while real Pi prompt/provider evidence remains TASK-009
- Requirements: `REQ-XCLI-002`, `REQ-XCLI-006`, `REQ-XCLI-007`, `REQ-XCLI-013` through `REQ-XCLI-016`
- Planned tests: `TEST-XCLI-006`, `TEST-XCLI-011`, `TEST-XCLI-014`, `TEST-XCLI-015`, `TEST-XCLI-021`
- Allowed writes: `adapters/agent-pi/**`
- Conditional writes: none beyond `adapters/agent-pi/**`; the accepted TASK-007 root manifest/lockfile and installed dependency tree are frozen and never owned by TASK-005
- Forbidden: tests, global Pi configuration, credentials, RPC implementation, unrelated packages, root manifests/lockfiles, and documentation
- Work: implement the production-default project-local `@earendil-works/pi-coding-agent@0.84.2` construction plus the single frozen optional `{sdkSessionFactory}` dependency-injection seam; keep `createPiAgentAnalysisRuntime({provider,model_id})` and the business Port unchanged; implement every exact facade signature/status, inert/no-persistence/no-built-in/no-ambient-resource/no-retry policy, three approved sequential custom-tool translations, terminal JSON parsing, bounded event projection, actual-model checks, cancellation/deadline quiescence, and sanitized failures in the same Adapter behavior. The second argument replaces construction only and is not a test mode, output substitute, product/Profile option, environment switch, fake provider/model branch, hardcoded proposal/Finding/business output, RPC path, or another export.
- Historical TASK-005 exit evidence is superseded for current TASK-010
  readiness by R3: TEST-XCLI-006 remains deterministic Adapter coverage;
  TEST-XCLI-011 must prove local-only preflight cached runtime/model and one
  Session, with no provider/model network call, persistence, ambient selection,
  or credential exposure (necessary local credential read is permitted);
  TEST-XCLI-013 remains the real prompt/provider proof.

### TASK-006 — Implement CLI, Personal Composition, and Canonical Example

- Role: original Worker resumes only after TASK-003 through TASK-005 target evidence and accepted bounded TASK-002 proposal-validator revision GREEN
- Requirements: `REQ-XCLI-001` through `REQ-XCLI-016`
- Planned tests: `TEST-XCLI-009` through `TEST-XCLI-022`
- Allowed writes: `apps/cli/**`, `profiles/personal/**`, `examples/member-analysis/member-orders-v1.csv`
- Forbidden: tests, other examples, Desktop, Console, enterprise Profile, global Pi settings, shared docs, and OpenSpec
- Work: expose only the frozen structured `runXanthil({input,output,application})` interaction and terminal contract: direct `next()->Event` input, first-question admission, complete Product-Core-valid result arms, CLI-owned deep-cloned/deep-frozen output/result values without caller/Application mutation, exact start/discover/confirm error mapping, and per-stage writer-failure stop semantics. Also implement explicit confirmation/rejection/EOF/interrupt cancellation causality, unsupported-edit cancellation (not a re-proposal loop), Personal Profile's closed four-field composition and `{application}` result, and the one exact canonical CSV. No Application public surface change belongs to this task. The exact example inventory contains only `examples/member-analysis/member-orders-v1.csv`; no example-local instruction file is authorized.
- Exit evidence: Test Correction 002's independent closed-envelope/direct-event/complete-manifest/clone-and-freeze/error-map/writer-stage leaves are GREEN; deterministic integration tests GREEN; fixture is exactly 530 bytes with SHA-256 `c0d1c3d2b1e8621955ab786dc87cebc14437033bda4def397498db5a1544ebb0`; Profile/import/composition pre-confirmation effects are absent; no success is rendered before a succeeded manifest commit; cancellation discards late success; out-of-scope surfaces remain absent.

### TASK-007 — Apply the Frozen Reproducible First Stack (Accepted)

- Role: completed Controller-bounded Worker execution after explicit user authorization; Controller accepted
- Requirements: `REQ-XCLI-001`, `REQ-XCLI-007`, `REQ-XCLI-008`, `REQ-XCLI-016`
- Planned tests: `TEST-XCLI-011`, `TEST-XCLI-012`, `TEST-XCLI-021`, `TEST-XCLI-022`
- Frozen stack: root `package.json` with `private` set to `true`, `type` set to `module`, `packageManager` set to `npm@11.12.1`, and `engines.node` set to `>=22.19.0`; root npm `package-lock.json`; production/test JavaScript `.mjs`; Node built-in test runner; exact direct dependencies only `@earendil-works/pi-coding-agent@0.84.2` and `typebox@1.3.7`; DuckDB CLI exact `1.5.2`; Python `>=3.9` standard library with no ambient Python packages
- Authorization record: satisfied for the completed TASK-007 root files and dependency installation; it grants no repeat install or future manifest/dependency change
- Historical writes: `/Users/huangbo/JuanerAI/package.json` and `/Users/huangbo/JuanerAI/package-lock.json` only within accepted TASK-007; no current write is authorized
- Forbidden: using the global Pi package as production resolution, other direct dependencies, TypeScript/compiler/build tooling, alternative lockfiles/package managers, ambient Python packages, unrelated upgrades, global installs, or credential changes
- Exit evidence: clean project-local npm install from the approved lockfile, exact dependency inventory, Node/npm/DuckDB/Python version checks, `node --test` availability, and no undeclared manifest drift.

### TASK-008 — Execute GREEN, Regression, Security, and Scope Verification

- Role: Controller orchestration after implementation freeze; no test/spec mutation
- Requirements: all
- Planned tests: all
- Allowed writes: evidence locations explicitly approved after the stack exists; `verification.md` and `traceability.md` remain Controller/Spec-package records, not Worker evidence sinks unless separately granted
- Work: run target `node --test` unit/contract/integration/E2E suites, `node --check` over production/test `.mjs`, architecture and security checks, scope/path diff, and fixture/checksum/reproduction checks. TypeScript, transpilation, bundling, and a build step are not applicable to this slice.
- Exit evidence: exact commands and outputs; target GREEN; regression PASS; forbidden-path and secret scan PASS; code/result placeholders resolved by Controller without changing approved behavior.

### TASK-009 — Perform Real Pi-Backed Acceptance Run

- Role: Spec -> Test -> Worker -> Controller-supervised integration after deterministic GREEN and explicit credential readiness
- Requirements: `REQ-XCLI-001`, `REQ-XCLI-002`, `REQ-XCLI-005` through `REQ-XCLI-007`, `REQ-XCLI-011` through `REQ-XCLI-016`
- Planned tests: `TEST-XCLI-011`, `TEST-XCLI-013`, `TEST-XCLI-014`, `TEST-XCLI-021`, `TEST-XCLI-022`
- Allowed data: only `member-orders-v1.csv` and its bounded aggregates
- Model: R4 activation candidate `minimax-cn/MiniMax-M3`; no automatic model fallback
- Forbidden: logging credentials/raw provider payloads, global setting mutation, real data, extra tools/network, or treating one stochastic narrative as calculation evidence
- Exit evidence: actual provider/model record, succeeded closed run, deterministic oracle reproduction, Evidence completeness, egress/tool inventory, and sanitized captured command/result.

**TASK-009 R4 embedded-runtime repair gate:**
`spec-task-009-cli-runtime-r4.md` restores the project-local embedded Pi SDK
with one in-memory native-tool session after decisive real MiniMax evidence;
its first prompt disables create-time refresh and performs exactly one explicit
local-only model refresh before `getModel`.
It freezes explicit MiniMax candidate selection, local-only model readiness,
closed think/JSON handling, dynamic Application-context response templates,
object-order semantics, and sanitized failure policy. It adds no dependency,
tool, fixture, retry, or product capability.

Before any production repair, Test owns only
`tests/contract/xanthil-local-analysis/**`,
`tests/integration/xanthil-local-analysis/**`, and necessary matching
`tests/fixtures/xanthil-local-analysis/**` helpers. It must return focused RED
for embedded R4 model readiness, native tool ordering, think-prefix,
duplicate-member, object-order, model-selection, sanitization, cancellation,
timeout, stream defect, dynamic template, and business-value-isolation AC.
R3.1 cases remain
except object-order rejection, which R4 retires. After Controller records
`TDD_READY_TASK009_EMBEDDED_RUNTIME_R4`, a fresh Worker may write only
`adapters/agent-pi/local-analysis.mjs`,
`packages/application/local-analysis.mjs` only for the frozen MiniMax
`modelIdentity`/dependency-validation/actual-model/run-provenance chain, and
`profiles/personal/local-analysis.mjs` for the guarded MiniMax
default. All tests are frozen for the Worker. Ports, Product Core,
CLI, other Adapters, fixture, dependencies, package/lockfile, global Pi,
credentials, and documentation outside this approved OpenSpec package are
forbidden. GREEN returns to the existing credential-gated TASK-009 real
acceptance; it does not alter TASK-010.

### TASK-010 — Independent Verification and Acceptance

- Role: Validator, read-only, after implementation/evidence freeze; Controller accepts
- Requirements: all
- Planned tests: all approved commands from TASK-008 and TASK-009 as permitted
- Writes: none for Validator
- Work: independently verify behavior, negative boundaries, architecture, contract suites, source/egress safety, lifecycle, scope, traceability, and evidence.
- Exit evidence: independent `PASS`, `FAIL`, or `BLOCKED` with reproducible evidence; Controller acceptance and OpenSpec archive remain later Controller actions.

**TASK-010 Validator-FAIL remediation R3 (Controller Spec Gate PASS):**
`spec-task-010-validator-remediation-r3.md` supersedes R1/R2 as the sole corrective package.
It restores pre-Discovery physical/run-root/runtime admission, actual source
read provenance, an active 300-second attempt deadline, and observed Pi
state; it adds no product capability or durable field. Test may write only
`tests/contract/xanthil-local-analysis/**`,
`tests/integration/xanthil-local-analysis/**`,
`tests/e2e/xanthil-local-analysis/**`, and necessary matching
`tests/fixtures/xanthil-local-analysis/**` to establish causal RED. After a
separate `TDD_READY_TASK010_REMEDIATION_R3`, Worker may write only
`packages/application/local-analysis.mjs`, `packages/ports/local-analysis.mjs`,
`adapters/analytics-duckdb/local-analysis.mjs`,
`adapters/storage-local/local-analysis.mjs`,
`adapters/agent-pi/local-analysis.mjs`, and
`profiles/personal/local-analysis.mjs`. Product Core, CLI, fixture, manifests,
dependencies, credentials, global Pi, project-control and all other paths are
forbidden. Green requires deterministic regression plus one real M3 rerun;
only then is a fresh independent Validator dispatched.

## Task-to-Path Freeze Summary

| Task | Owned write paths | Conditional paths | Never owned |
|---|---|---|---|
| TASK-001 | named `tests/**` slices | none | production/specs |
| TASK-002 | `packages/product-core/**`, `packages/contracts/**` | none | tests/adapters/surfaces |
| TASK-003 | `packages/application/**`, `packages/ports/**` | none | tests/concrete infrastructure |
| TASK-004 | `adapters/analytics-duckdb/**`, `adapters/storage-local/**` | none | tests/Agent/surfaces/root manifests |
| TASK-005 | `adapters/agent-pi/**` | none | tests/global Pi/RPC/root manifests |
| TASK-006 | `apps/cli/**`, `profiles/personal/**`, exact example path | none | tests/other surfaces/root manifests |
| TASK-007 | accepted historical root `package.json` and `package-lock.json` | none currently; future dependency changes require new authority | repeat/global install or unrelated dependencies |
| TASK-008..010 | validation/acceptance evidence only as separately authorized | trace/verification Controller updates | behavior changes |

No Worker may edit approved tests to obtain GREEN. A discovered incorrect test returns to Test Design; a contract mismatch returns to the Controller and blocks dependent work.
