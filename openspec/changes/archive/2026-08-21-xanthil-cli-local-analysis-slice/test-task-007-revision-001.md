# TASK-007 Test Revision 001 — ESM-Only Package Resolution

Status: **FROZEN**  
Controller: Codex  
Date: 2026-08-20  
Change: `xanthil-cli-local-analysis-slice`

## Preserved Worker Evidence

- Exact approved `package.json` and npm lockfile v3 were created.
- Project-local install completed once with lifecycle scripts suppressed.
- Root lock/direct inventory contains only exact `@earendil-works/pi-coding-agent@0.84.2` and `typebox@1.3.7`.
- Node `v26.0.0`, npm `11.12.1`, DuckDB `v1.5.2`, and Python `3.9.6` pass.
- ESM resolution succeeds locally:
  - `file:///Users/huangbo/JuanerAI/node_modules/@earendil-works/pi-coding-agent/dist/index.js`
  - `file:///Users/huangbo/JuanerAI/node_modules/typebox/build/index.mjs`
- The one focused test failure is `ERR_PACKAGE_PATH_NOT_EXPORTED` from TEST-XCLI-021 using CommonJS `createRequire.resolve` on the Pi package root.

## Controller Diagnosis

`@earendil-works/pi-coding-agent@0.84.2` intentionally exports its root only under the ESM `import` condition. CommonJS `createRequire.resolve` is therefore the wrong test seam and correctly fails. Node ESM `import.meta.resolve` resolves the same approved package to the project-local ESM entry. This is a frozen test defect, not manifest, lock, dependency, or Worker implementation drift.

## Allowed Correction

- Allowed write only: `tests/integration/xanthil-local-analysis/local-analysis.integration.test.mjs`.
- Remove the now-unused `createRequire` import.
- In TEST-XCLI-021, resolve both approved packages through the Node ESM resolver used by the product stack, convert the returned file URL to a filesystem path, and keep the existing project-local prefix assertion.
- Preserve exact manifest/lock/metadata/version/configuration assertions and every negative-first oracle, including rejection of a fake ambient/global path.
- Forbidden: package/lock/node_modules, production, other tests, OpenSpec except this Controller-owned revision, project-control, dependency/install/global/model/network changes, assertion weakening, or CommonJS compatibility shims.

## Validation Budget

- Syntax/static checks on the one owned test file: any number.
- One focused execution maximum:
  - `node --test --test-name-pattern='^TEST-XCLI-021' tests/integration/xanthil-local-analysis/local-analysis.integration.test.mjs`
- No install, dependency command, partial/equivalent test, full suite, Agent Adapter, E2E, model, network, or rerun.
- Expected result: `1/1` PASS, zero fail/cancelled/skipped/todo. Otherwise stop `TEST_DESIGN_BLOCKED`.

Return exact changed lines, syntax and focused counts, preserved negative inventory, scope confirmation, and `TEST_CORRECTION_READY_TASK_007` or an explicit stop signal. Do not start Worker/Validator.
