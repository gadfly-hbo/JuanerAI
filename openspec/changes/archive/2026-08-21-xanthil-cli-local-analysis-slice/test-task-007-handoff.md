# TASK-007 Test Handoff — Authorized Reproducible Stack

Status: **FROZEN FOR TEST AUTHOR**  
Controller: Codex  
Date: 2026-08-20  
Change: `xanthil-cli-local-analysis-slice`

## Gate and Authority

- Spec Gate: PASS.
- User authorization is explicit: create `/Users/huangbo/JuanerAI/package.json` and `/Users/huangbo/JuanerAI/package-lock.json`, then perform a project-local npm install of exact `@earendil-works/pi-coding-agent@0.84.2` and `typebox@1.3.7`.
- TASK-002 through TASK-004 are Controller accepted.
- Goal: replace the authorized-install placeholder with executable TEST-XCLI-021 evidence and establish expected RED caused only by the absent project-local manifest/lock/install artifacts.
- Pre-agreed public seam: the approved root package/lock artifacts, project-local Node resolution, exact local package metadata, and installed engine-version commands frozen by TEST-XCLI-021. This is artifact/readiness behavior, not an internal implementation seam.
- Non-goal: no manifest/lockfile/node_modules creation, npm install, production edit, Pi Adapter edit, model call, credential read, global Pi mutation, or real-model E2E activation.

## Route and Ownership

- Role: fresh Test Agent.
- Classification: R2/standard because this freezes a supply-chain/dependency contract with exact versions and ambient-resolution rejection.
- Route: `gpt-5.6-terra` high in a bounded context. One route attempt; a real contract ambiguity returns `TEST_CONFLICT`.
- Allowed writes only:
  - `tests/integration/xanthil-local-analysis/local-analysis.integration.test.mjs`
  - optionally one focused test-only helper under `tests/fixtures/xanthil-local-analysis/` if it materially keeps the readiness oracle independent and closed.
- Forbidden: package/lock files, `node_modules`, production, approved Spec/Design/Tasks, other tests, project-control, global npm/Pi paths, credentials, environment mutation, network, model calls, and every other path.
- Preserve every existing test and assertion. Replace only the exact TEST-XCLI-021 authorization skip and add the minimum supporting imports/helper.

## Frozen Stack Assertions

TEST-XCLI-021 must verify from `/Users/huangbo/JuanerAI`:

1. Root `package.json` is exactly the approved closed object: `private:true`, `type:'module'`, `packageManager:'npm@11.12.1'`, `engines.node:'>=22.19.0'`, and exact direct dependencies only `@earendil-works/pi-coding-agent:'0.84.2'` and `typebox:'1.3.7'`.
2. No scripts, devDependencies, optionalDependencies, workspaces, compiler, bundler, build field, other package manager, or additional direct dependency exists.
3. Root `package-lock.json` is the npm lock for that exact manifest; its root package mirrors the exact direct dependencies and its local package entries resolve exact versions `0.84.2` and `1.3.7`.
4. Both packages resolve from the project-local `/Users/huangbo/JuanerAI/node_modules/` tree, not the already-installed global Pi location or another ambient prefix. Read their project-local package metadata and assert exact name/version.
5. Runtime prerequisites are executable and exact/bounded: Node satisfies `>=22.19.0`; npm is exact `11.12.1`; DuckDB CLI is exact `1.5.2`; Python is `>=3.9`.
6. The repository has no alternative lockfile/package manager, TypeScript/compiler/build configuration, Python dependency manifest, or ambient package declaration for this slice.

Add negative-first oracle evidence that independently rejects at least: extra direct dependency, ranged/wrong dependency version, altered package manager, incompatible Node/npm/DuckDB/Python version, mismatched lock root, ambient/global package resolution, and compiler/build fields. Mutations must be test-owned values or isolated test-owned temporary artifacts; never mutate the real root or global installation.

Do not require credentials, provider discovery, SDK session creation, network, or a model call in TEST-XCLI-021. TEST-XCLI-011/006 remain separate Pi Adapter RED seams. TEST-XCLI-013 remains skipped until the later credential-readiness Gate.

## RED Quality and Validation Budget

- Syntax checks on changed test `.mjs`: any number.
- Test-only oracle/helper health, if added: maximum one focused execution.
- Final TEST-XCLI-021 expected RED: maximum one execution:
  - `node --test --test-name-pattern='^TEST-XCLI-021' tests/integration/xanthil-local-analysis/local-analysis.integration.test.mjs`
- No install, package creation, Agent Adapter target, full suite, TASK-004 target, E2E, network, or equivalent retry.
- Expected RED must be caused only by absent root `package.json`/`package-lock.json`/project-local modules. Version prerequisites already observed by Controller are Node `v26.0.0`, npm `11.12.1`, DuckDB `v1.5.2`, Python `3.9.6`.
- If syntax/helper fails, intended leaves are not scheduled, or another environment/contract cause appears, stop `TEST_DESIGN_BLOCKED`; do not edit production or manifests.

## Handoff

Return changed test paths, TEST-XCLI-021 leaf/negative inventory, syntax/helper evidence, focused RED counts and root cause, zero skipped/cancelled/todo within the focused pattern, scope/write-risk summary, and `TDD_READY_TASK_007` or an explicit stop signal. Do not install dependencies or start Worker/Validator.
