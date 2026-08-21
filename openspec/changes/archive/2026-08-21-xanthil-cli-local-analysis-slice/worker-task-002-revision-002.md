# TASK-002 Revision Contract 002

Status: **FROZEN**  
Controller: Codex  
Date: 2026-08-20  
Origin: TASK-002 Controller review changes requested after Revision 001

This contract is immutable for this revision. It supplements, and does not replace, `worker-task-002-handoff.md` and `worker-task-002-revision-001.md`. This is the second Worker correction; the checklist below is complete and stable. Any additional behavior, path, command, or test change requires `REVISION_SCOPE_ESCALATION`.

## Root Cause and Acceptance Delta

Revision 001 reached its then-current unit GREEN, but Controller review found that the tests did not independently expose every approved closed-contract invariant. The Test author corrected only test-owned paths and established a valid RED with all 108 leaf subtests scheduled: 17 leaf failures under five aggregate TEST IDs. Production must close exactly these seven deltas:

1. `calculateMemberRepurchaseMetrics` accepts only the frozen canonical fixture bytes whose SHA-256 is `c0d1c3d2b1e8621955ab786dc87cebc14437033bda4def397498db5a1544ebb0`; a different but structurally valid 20-row CSV fails closed.
2. Metric validation requires integer counts satisfying `order_count >= 0`, `active_member_count > 0`, `repeat_purchaser_count >= 0`, `order_count >= active_member_count`, and `repeat_purchaser_count <= active_member_count`.
3. The canonical Source descriptor requires exact `byte_size=530` in addition to the already frozen identity, kind, path, SHA-256, and fixture version.
4. Artifact descriptors use the exact approved mappings: `Q-001` → `queries/Q-001.sql` / `application/sql`; `S-001` → `scripts/S-001.py` / `text/plain`; `O-001` and `O-002` → corresponding JSON paths / `application/json`; `DOC-SUMMARY` and `DOC-EVIDENCE` → their frozen Markdown paths / `text/markdown`. A succeeded run requires exactly these six artifacts, no omissions or additions. In-progress, failed, and cancelled records may be asset-free subject to their existing lifecycle rules.
5. `result_reference.json_pointer` accepts the empty RFC 6901 pointer and valid multi-segment pointers with only `~0` and `~1` escapes; it rejects missing leading slash for non-empty values, invalid escapes, and dangling `~`. The exact validation pattern is equivalent to `^(?:/(?:[^~/]|~[01])*)*$`.
6. `reproduceRecordedMetrics` has a closed input of exactly `fixture_bytes` and `fixture_sha256`. `narrative`, `session_history`, any other field, and fields present with `undefined` are rejected; replay remains derived only from the frozen bytes and checksum.
7. Preserve fail-closed handling for absent, null, undefined, and unknown fields throughout these touched validators; no optional compatibility field or silent normalization is authorized.

## Allowed and Forbidden Paths

- Allowed write: `packages/product-core/local-analysis.mjs`
- Conditional writes: none
- Forbidden: every other file, including tests, fixtures, OpenSpec, `packages/contracts/**`, Application, Ports, Adapters, apps, profiles, manifests, dependencies, and project-control

## Required Code Shape

- Keep the sole module export `createLocalAnalysisDomain()` and the existing public business methods. No new public method, test mode, fault flag, or test-only production surface is authorized.
- Preserve Node built-ins only; do not add SDKs, I/O, environment access, clocks, retries, or dependencies.
- Reuse the frozen canonical fixture/source/artifact facts within the module; do not accept caller-provided expected values.
- Do not weaken any assertion or negative behavior that already passes.

## Exact Validation Allowlist and Budget

- Static/syntax commands, any number if read-only and limited to the allowed file:
  - `node --check packages/product-core/local-analysis.mjs`
  - `rg` checks limited to `packages/product-core/local-analysis.mjs`
- Final GREEN command, maximum **one** Worker execution:
  - `node --test tests/unit/xanthil-local-analysis/*.test.mjs`
- Full test, contract, integration, E2E, install, build, model, network, and other commands: forbidden.
- If the one final GREEN command fails, stop and return `REVISION_SCOPE_ESCALATION` with the exact failure. Do not edit tests or run an equivalent retry.

## Acceptance Evidence

- `node --check` PASS.
- Final unit target PASS with all 118 tests/subtests and 108 leaf subtests scheduled; report command count `1/1`.
- Handoff maps the seven deltas above to source locations.
- Static scan shows only the approved export, no forbidden imports or test-only surface, and no write outside the allowed file.

## Stop Lines

- A contradiction between the frozen tests and approved Spec/Design returns `TEST_CONFLICT`.
- A needed new field, enum, media type, public API, dependency, or path returns `REVISION_SCOPE_ESCALATION`.
- No downstream task starts until Controller independently reviews and accepts TASK-002.
