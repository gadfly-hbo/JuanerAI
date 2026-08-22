# Verification

## Current verdict

**FINAL PASS / CONTROLLER ACCEPTED / BASELINE PUBLISHED / ARCHIVED.** The fresh
independent Validator returned PASS. The approved one-file workflow is GREEN,
the canonical local regression is GREEN, the Test Asset Retirement Gate is
PASS, the current specification is published at
`openspec/specs/pr-ci-validation/spec.md`, and this complete Change is
archived. No remote CI run, GitHub configuration change, or external
model/provider call occurred.

## Spec Gate evidence

- Change class: R1 ordinary capability, per
  `docs/governance/change-complexity-control.md`; one bounded governance
  behavior reusing `canonical-validation`.
- Reused authority: `openspec/specs/canonical-validation/spec.md` and
  `tools/harness/validation/run` are unchanged and remain the sole offline
  validation authority.
- Scope: Worker `.github/workflows/ci.yml` only; conditional Test path is one
  dependency-free static declaration test; every other production/test/package
  path is forbidden.
- External boundary: GitHub-hosted Ubuntu, approved official Actions, npm
  registry for exact npm/lockfile dependencies, and fixed official DuckDB
  release asset only. No credentials, business data, provider/model, or GitHub
  write boundary is introduced.
- DuckDB provenance: official GitHub Release v1.5.2 asset
  `duckdb_cli-linux-amd64.zip`, Release API asset `digest`
  `sha256:fc9145affabca627431e73ddaf6b8117e5c192692480c13886f227be202d5d15`,
  observed 2026-08-22.
- Complexity: the required pre-Gate `ponytail-review` found no deletion target
  (`Lean already. Ship.`). There is no persistence, retry, recovery, protocol,
  enterprise-readiness claim, or new runtime mode.

## GREEN and regression evidence

- Worker production path: `.github/workflows/ci.yml` only, matching the frozen
  one-file write set.
- Focused workflow test: `node --test
  tools/harness/validation/ci-workflow.test.mjs` passed 2/2.
- Canonical-runner contract regression: `node --test
  tools/harness/validation/run.test.mjs` passed 4/4.
- YAML syntax parse: Ruby `YAML.load_file` returned `yaml parse: ok`.
- Canonical offline regression: `tools/harness/validation/run` exited 0; its
  accepted deterministic suites passed, including 250/250, 198/198, 243/243,
  131/132 with the one expected real-Pi skip, and project-board 12/12.
- Repository hygiene: `git diff --check` passed.
- No remote workflow execution was required or authorized. A fresh Validator
  independently returned PASS before acceptance.

## Test Design / expected RED evidence

- Test asset: `tools/harness/validation/ci-workflow.test.mjs`
- Test identity: `PRCI-TEST-001` through `PRCI-TEST-004`, represented by the
  four bounded assertion leaves in the public workflow-declaration test.
- Asset SHA-256: `df94404599c6d8b9a2212b33c0076cbd664155ecbd9cb670645516d9951f0820`
- Focused command: `node --test tools/harness/validation/ci-workflow.test.mjs`
- Correction 001 health proof: the complete assertion helper independently
  passed against one minimal in-memory workflow declaration. This proves the
  dependency-free structural assertions accept the approved shape before the
  public absent declaration is observed. Job counting is bounded to the
  `jobs:` block; Node and npm checks are required before `npm ci`; and the
  temporary bin must explicitly receive selected node/npm and extracted DuckDB.
- Correction 002 root cause: at the second-correction stop line the Controller
  classified the prior test as invalid under the frozen no-cache contract,
  rather than finding a missing product decision. `actions/setup-node@v7`
  defaults npm caching when the repository declares npm; the helper now
  requires its explicit `package-manager-cache: false` control, rejects a
  `cache:` package-manager input and `actions/cache`, and permits that explicit
  false control. The in-memory valid declaration passes these corrected checks;
  this satisfies the stop-line release condition.
- RED result: 2 tests total, 1 passed, 1 failed. The sole failure was
  `ENOENT` opening `/Users/huangbo/JuanerAI/.github/workflows/ci.yml` at the
  public declaration read. The helper passed before that read, so no assertion
  harness failure occurred; the absent Worker-owned workflow is therefore the
  causal missing behavior.
- Unaffected baseline: `node --test tools/harness/validation/run.test.mjs`
  passed 4/4.
- Frozen Worker write set: `.github/workflows/ci.yml` only. The focused test
  neither writes workflow state nor invokes GitHub, providers/models, or
  external downloads.

### Test Asset Retirement lifecycle ledger

| Asset | Class | REQ/AC evidence purpose | Retained consumer | Final disposition |
|---|---|---|---|---|
| `tools/harness/validation/ci-workflow.test.mjs` | permanent regression | PRCI-REQ-001..003; PRCI-AC-001..006; trigger, permission/concurrency, fixed provenance, and forbidden-side-effect boundaries | CI-change validation and independent Validator | retain after GREEN |

### Test Asset Retirement Gate

**PASS.** The complete test-asset diff contains only
`tools/harness/validation/ci-workflow.test.mjs`; its SHA-256 remains
`df94404599c6d8b9a2212b33c0076cbd664155ecbd9cb670645516d9951f0820`.
It is retained as permanent regression coverage owned by PRCI-REQ-001..003 and
PRCI-AC-001..006. The file contains no skipped, todo, only, scratch,
correction-intermediate, obsolete-path, fixture, double, mock, snapshot, or
unconsumed helper asset. The in-memory valid declaration is the health proof
for the shared assertion helper, not equivalent behavior coverage. The
complete-diff `ponytail-review` found no deletion target (`Lean already.
Ship.`). Affected commands passed 2/2 focused workflow tests and 4/4 canonical
runner contract tests; there are no removed assets or retirement candidates.

## Activation and rollback readiness

Merge to `main` is the sole activation. Removal of `.github/workflows/ci.yml`
in a follow-up governed change is rollback. No branch-protection mutation,
workflow dispatch, cache/artifact cleanup, data migration, or external
compensation is authorized.

## Independent Validator and Controller acceptance

The fresh read-only `juaner_validator` returned **PASS** after independently
checking PRCI-REQ-001..003, PRCI-AC-001..006, exact scope, declarative
security and supply-chain boundaries, traceability, and the complete Test Asset
Retirement ledger. Its read-only commands passed: focused CI test 2/2,
canonical-runner contract test 4/4, YAML parse, `git diff --check`, and the
complete canonical runner with 250/250, 198/198, 243/243, 131/132 plus the one
expected real-Pi skip, and project-board 12/12. The test hash matched the
frozen value.

The Controller accepts the Change because the approved requirements, negative
boundaries, causal RED, GREEN, regression, scope, retirement Gate, and
independent verdict are all closed. A remote GitHub Actions run was neither
required nor authorized by this Change; clean hosted-runner execution becomes
observable only after the workflow is pushed and activated through the normal
PR/merge path. Branch-protection configuration remains a separate governance
decision.

## Baseline publication and archive

The accepted capability specification was published unchanged at
`openspec/specs/pr-ci-validation/spec.md`. The complete Change package was
archived at `openspec/changes/archive/2026-08-22-pr-ci-validation/`; no active
`openspec/changes/pr-ci-validation/` package remains.
