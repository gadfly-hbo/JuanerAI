# TASK-002 Revision Contract 001

Status: **FROZEN**  
Controller: Codex  
Date: 2026-08-20  
Origin: TASK-002 Controller review changes requested

This contract is immutable for this revision. It supplements, and does not replace, `worker-task-002-handoff.md`. Any additional behavior, path, command, or test change requires `REVISION_SCOPE_ESCALATION`.

## Root Cause and Acceptance Delta

The first TASK-002 candidate reached the then-current unit GREEN, but the tests omitted approved Design invariants. Corrected tests now produce valid RED against the preserved candidate. The revision must close exactly these four deltas:

1. Every baseline/recent result object includes exact `window_id=baseline|recent` and remains closed.
2. Result validation proves internal consistency: reduced rate equals repeat/active, delta equals recent-minus-baseline times 100, and signal status equals the exact rate comparison.
3. The canonical Source descriptor rejects any path or SHA other than the approved fixture identity.
4. Run Manifest Artifact descriptors are closed and validated for unique ID/path, category, ID-to-path mapping, approved media type/extension, non-negative byte size, and SHA-256.

## Allowed and Forbidden Paths

- Allowed write: `packages/product-core/local-analysis.mjs`
- Conditional writes: none
- Forbidden: every other file, including tests, fixtures, OpenSpec, `packages/contracts/**`, Application, Ports, Adapters, apps, profiles, manifests, dependencies, and project-control

## Required Code Changes

- Update pure metric construction and validation only; no caller-provided expected values.
- Add a pure Artifact descriptor validator used by `validateRunManifest`; validate every descriptor in original order and reject duplicate IDs or paths.
- Keep the sole module export `createLocalAnalysisDomain()` and existing real business methods. No new public method is authorized.
- Preserve Node built-ins only and all closed-interface rejection behavior.

## Exact Validation Allowlist and Budget

- Static/syntax commands, any number if read-only and path-limited:
  - `node --check packages/product-core/local-analysis.mjs`
  - `rg` checks limited to `packages/product-core/local-analysis.mjs`
- Final GREEN command, maximum **one** Worker execution:
  - `node --test tests/unit/xanthil-local-analysis/*.test.mjs`
- Full test, contract, integration, E2E, install, build, model, network, and other commands: forbidden.
- If the one final GREEN command fails, stop and return `REVISION_SCOPE_ESCALATION` with the exact failure. Do not edit tests or run an equivalent retry.

## Acceptance Evidence

- `node --check` PASS.
- Final unit command PASS with all 10 tests and the added negative matrices executed.
- Path scan shows exactly the allowed production file changed in this revision and no forbidden imports/test-only surface.
- Handoff identifies source locations for all four deltas and reports final command count `1/1`.

## Stop Lines

- A contradiction between corrected tests and approved Spec/Design returns `TEST_CONFLICT`.
- A needed new field, enum, media type, public API, dependency, or path returns `REVISION_SCOPE_ESCALATION`.
- No downstream task starts from this revision until Controller review accepts TASK-002.
