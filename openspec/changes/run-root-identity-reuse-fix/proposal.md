# Restore Run-Root Replacement Rejection

## Decision

Class: boundary correction, R2/standard. This Change repairs a production defect within the accepted local-analysis contract: a Run Artifact Store constructed for a physical run root must reject that configured path after the original directory is removed and replaced, including immediate same-path replacement on Linux when the filesystem would otherwise reuse the former `(dev, ino)` pair.

The observable contract is physical-root continuity: preflight accepts only the same directory object accepted at construction. A private descriptor-pinning mechanism, defined in `design.md`, removes Linux inode-reuse ambiguity without changing the Port, Profile, CLI, manifest, Artifact format, lifecycle, stable failure vocabulary, runner, or CI behavior.

## Objectives

- Product objective: preserve safe run-artifact containment for the approved personal local-analysis Profile.
- Delivery objective: merge one Adapter-only correction with the existing regression leaf unchanged.
- Learning objective: obtain one clean GitHub-hosted Linux proof that the former Adapter fails the same-path replacement leaf and the corrected Adapter passes it, without treating CI configuration as product scope.

## Reused Contract

The Change preserves REQ-XCLI-001/AC-XCLI-001-01..02, REQ-XCLI-007/AC-XCLI-007-01, REQ-XCLI-009..016, the Run Artifact Store surface, `RUN_ROOT_UNSAFE`, `ARTIFACT_WRITE_FAILED`, all Artifact publication semantics, and `TEST-XCLI-008`. The current local-analysis specification remains the behavior baseline; this delta closes an unrepresented filesystem identity mechanism needed to make its existing unsafe-root promise true on Linux.

## Scope

Allowed paths:

- `openspec/changes/run-root-identity-reuse-fix/**` for this package.
- After Spec Gate and causal RED, Worker production path: `adapters/storage-local/local-analysis.ts` only.

Conditional evidence-only path: a Controller-created temporary draft proof branch/PR may combine the frozen Adapter candidate with the already-reviewed CI workflow solely to run one clean GitHub-hosted Linux canonical validation. It is never merged; no workflow file belongs in the final fix PR.

Forbidden paths: production other than the single Adapter path; every test, fixture, helper, coverage map, Port, Product Core, Application, Profile, CLI, package/lockfile, `.github` final-PR change, current specification, archive, project-control, data, and dependency path.

## Non-goals

No marker file, birthtime/mtime heuristic, retry, fallback, repair, migration, data change, new dependency, Port method, public `close`, background process, listener, cache, global registry, extra runtime mode, CI policy change, or descriptor-backed write path.

## Activation, Rollback, Retirement

Activation is merge of the Adapter correction to `main` after the normal Spec/Test/Worker/Validator gates and required evidence. Rollback is a source revert of that Adapter correction; it neither rewrites nor migrates user Artifacts. Retirement introduces neither a product artifact nor a cleanup protocol.

## Ponytail Disposition

Controller ponytail review found descriptor acquisition, exact flags/`fstat`, and process-exit lifetime over-specified as durable capability. Accepted: the delta specification now contains only physical-root continuity, unsafe replacement rejection, and unchanged public/persistence surface. The minimum descriptor-pinning mechanism remains design/task detail because it is necessary to prove that observable contract on inode-reusing Linux.

## Routing Record

The dispatch is R2, whose Spec route floor is Sol-high under `docs/governance/agent-model-routing.md`. The configured `juaner_spec` role is fixed at Terra-medium and cannot take that override. This package is therefore delivered with **unavailable-route constraint recorded**; it does not lower risk, expand authority, pass Spec Gate, or authorize subsequent work. Controller (Sol-xhigh) must perform the full Gate and the mandatory complete-OpenSpec-diff `ponytail-review` because the R2 route floor was unavailable.
