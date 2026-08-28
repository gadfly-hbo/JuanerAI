# CHG-xanthil-desktop-session-bootstrap D1-A Targeted Readback 001

> Readback ID: `D1A-XDSB-READBACK-001`
> Reviewer finding: `D1A-XDSB-REVIEW-001` single `SPEC_BLOCKER`
> Date: 2026-08-28
> Controller disposition: `PASS_AFTER_BOUNDED_CORRECTION`
> Dispatch disposition: `READY_AFTER_PREREQUISITES`; currently blocked

## Finding received

The unique fresh D1-A Reviewer found one contradiction: dependency and lockfile health was deferred until before Worker, while the signed authority package must already close the dependency boundary and the Test role must establish causal RED in a healthy environment. Missing packages, a broken runner, unreviewed install scripts, or a non-starting Electron binary cannot count as RED.

Finding classification: `SPEC_BLOCKER`.

## One bounded correction

Only `docs/planning/2026-08-28/d1a/xanthil-desktop-session-bootstrap-d1a-intake.md` changed:

1. `package.json` and `package-lock.json` moved from Worker scope to a mechanical Test environment-provisioning scope.
2. Before signed DISPATCH, Controller must freeze a content-addressed exact dependency manifest containing direct package/version/purpose/classification, registry/integrity, license, reviewed install-script, Node, and forbidden-capability decisions.
3. The Test role may materialize only that frozen manifest and return the lock hash; it cannot select or change dependencies.
4. Fresh install, baseline typecheck/suites, exact package resolution/integrity, Electron smoke, helper/fixture health, and absence of unapproved packages/scripts/registries/paths must pass before behavior RED.
5. Environment/toolchain/dependency failure is `TEST_CONFLICT` or `BLOCKED`, never causal RED or TDD_READY.
6. Causal RED must execute after environment health and fail at missing approved product behavior across Core/Application, Port/Adapter, and Desktop/preload classes.
7. After health freeze, package and lock are read-only to Worker; any requested delta returns to Controller and invalidates TDD_READY.
8. The exact dependency policy was added to the DISPATCH prerequisite table.

No product goal, Acceptance Criterion, UI behavior, persistence meaning, path authority outside the two package files, platform claim, Runtime boundary, role ordering, external prerequisite, or Model Pack stop line changed.

## Targeted readback

- Corrected D1-A intake SHA-256: `2258dd7f8b960557a46b8717582c02cf81d353f32a0f4b59f24b0096953c6f9d`.
- Review artifact SHA-256: `1f0f447c1143c2eaae54784db27a7bc578d930b8d66e35c6e2b03c14ef68b088`.
- Corrected dependency ordering is explicit at D1-A §7; RED separation is explicit at §8; the dependency prerequisite is explicit at §10.
- Test and Worker path scopes are disjoint after the correction: Test alone owns the two package files for exact mechanical provisioning; Worker cannot mutate them.
- The existing order remains Spec Gate PASS → Test environment health → causal RED/TDD_READY → Worker; no pre-Spec implementation or hidden fifth role was introduced.
- `git diff --check` passes.

## Controller disposition

The single `SPEC_BLOCKER` is closed by the one permitted bounded correction. Per `product-change-execution-policy.md`, no second D1-A Reviewer is launched. The D1-A Artifact Package is semantically ready to freeze only after every external prerequisite is verified.

Current blockers remain:

1. approved D0.5 records are not committed/pushed/merged into `origin/main`;
2. exact dependency manifest/review is not frozen;
3. the current Mac mini empty-WIP pointer is verified, but freshness must be re-read immediately before signing;
4. the product owner reports no real Windows 11 x64 acceptance host;
5. macOS signing/notarization remains pending verification and Windows signing is unavailable;
6. a clean Mac mini worktree at the eventual integrated post-merge baseline does not exist.

No signed DISPATCH, OpenSpec, dependency installation, Test, Worker, model/provider call, real data access, or Model Pack work is authorized while any blocker remains.
