# TASK-004 Worker Revision 001 — Successful Markdown Descriptor Branch

Status: **FROZEN**  
Controller: Codex  
Date: 2026-08-20  
Change: `xanthil-cli-local-analysis-slice`

## Accepted Evidence

- Worker changed only the two TASK-004 Adapter files.
- Both Adapter files pass syntax checks.
- The one authorized `^TASK-004` target scheduled all `71` leaves: `69` pass, `2` fail, zero cancelled/skipped/todo.
- Analysis Adapter is accepted provisionally at `32/32` GREEN.
- Artifact Adapter passes `37/39`; every constructor, containment, collision, symlink/non-regular, atomic failed replacement, terminal read/immutability, retained-asset, obstruction, and cross-run leaf is GREEN.
- The only failures are the shared real-filesystem contract success and direct integration success. Both reject a valid `commitSuccess` with sanitized `ARTIFACT_WRITE_FAILED`.

## Controller Diagnosis

The tight failing seam is the valid `commitSuccess` path. Static data-flow tracing identifies one exact production defect in `adapters/storage-local/local-analysis.mjs`:

- The Artifact loop uses negative descriptor predicates in an `if / else if / else` chain.
- For a valid `DOC-SUMMARY` descriptor, the first negative predicate is false; the `DOC-EVIDENCE` predicate is also false; control therefore reaches the final `else` and calls `ensureIndexed` before `summary.md` exists.
- The same structural problem applies to a valid `DOC-EVIDENCE` descriptor.
- This explains both failures and is consistent with the successful post-validation obstruction leaf. Evidence validation, success order, canonical checksums, and existing Q/S/O indexing are not the failing boundary.

## Ownership and Exact Revision

- Allowed write only: `adapters/storage-local/local-analysis.mjs`.
- Frozen and forbidden: the Analysis Adapter, every test/fixture, packages, Agent/CLI/Profile, docs/OpenSpec except this Controller-owned revision, project-control, root manifests/dependencies, and every other path.
- Change only the successful-manifest descriptor branching so:
  - `DOC-SUMMARY` is validated against the exact derived summary descriptor and is not read before publication;
  - `DOC-EVIDENCE` is validated against the exact derived evidence-document descriptor and is not read before publication;
  - only Q/S/O descriptors call `ensureIndexed` before success publication.
- Preserve the existing write order: `evidence.json`, `summary.md`, `evidence.md`, then atomic succeeded `run.json` last.
- Preserve every prior negative boundary, sanitized error, obstruction behavior, terminal rule, and public surface. No helper, abstraction, retry, cleanup, test flag, or contract change is authorized.

## Validation Budget

- Syntax/static checks on the owned storage file: any number.
- Final focused command: maximum **one** new Worker execution:
  - `node --test --test-name-pattern='^TASK-004' tests/contract/xanthil-local-analysis/local-analysis-ports.contract.test.mjs tests/integration/xanthil-local-analysis/local-analysis.integration.test.mjs`
- No partial/equivalent probe, helper target, unit/TASK-003/E2E/full suite, install/build, model, network, or rerun.
- If the target is not `71/71` GREEN, stop `REVISION_SCOPE_ESCALATION` with exact failures; do not edit tests or broaden production scope.

## Handoff

Return the exact changed source lines, syntax/static result, full focused counts and command budget `1/1`, scope/write-risk confirmation, and `TASK_004_READY_FOR_CONTROLLER_REVIEW` or the applicable stop signal. Do not start TASK-005 or Validator.
