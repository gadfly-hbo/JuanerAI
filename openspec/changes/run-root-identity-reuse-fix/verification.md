# Verification Intent and Revision 002 Evidence Boundary

## Current verdict

**CONTROLLER EVIDENCE FREEZE — REVISION 002; INDEPENDENT VALIDATION PENDING.** Validator rejected the prior implementation/evidence freeze. Revision 002 implements the frozen live-path descriptor acquisition linearization point and preserves permitted owner-write/search-only mode `0300` roots. Local focused, contract, canonical regression, the single authorized Ubuntu proof, and the Test Asset Retirement Gate are complete. Acceptance remains locked pending both the required Validator and the supplementary independent Sol-high review.

The R2 Spec route constraint remains: `juaner_spec` is fixed Terra-medium while the routing policy requires Sol-high. The required Spec role revised the complete package; Controller at Sol-xhigh reviewed the proposal, normative delta, design, tasks, test plan, traceability, evidence boundary, current candidate, Validator findings, and deterministic RED feasibility before issuing this new Gate. Validator also returned `ROUTING_ESCALATION_REQUIRED`; that is recorded, not waived, and final validation must include an additional independent Sol-high review.

## Rejected Evidence and Board Remediation

The earlier Worker candidate, local GREEN, and Ubuntu `243/243` proof are rejected as completion evidence. They remain regression evidence only for replacement before the preflight call. They do not prove concurrent in-preflight replacement or mode-`0300` compatibility. Previous tasks marked complete are reopened in `tasks.md`.

The former board state claiming frozen implementation/evidence was false for this revised contract. Controller owns and has corrected the board; this package neither writes project-control nor treats the board as authority.

## Established Causal RED Feasibility

Controller verified two deterministic candidates without a production seam:

1. A fresh Node 26 child started with `--experimental-test-module-mocks` mocks `node:fs` before importing the Adapter. On the preflight's second `lstatSync`, it records the original stat, synchronously removes/recreates the root, then returns that stale stat. The frozen Adapter exits `1` with `Missing expected rejection`. This is causal RED for replacement between path observation and live descriptor acquisition.
2. A test-owned mode-`0300` root permits known-file write/remove but the frozen factory fails exactly `ARTIFACT_WRITE_FAILED`. This is causal RED for owner-write/search compatibility.

The Test role froze the exact child source, commands, hashes, expected exits, and no-write assertions in `test-handoff.md`. Controller independently reran the focused Revision-002 command: exit `1`, tests `2`, pass `0`, fail `2`. The mode-`0300` leaf failed exactly `ARTIFACT_WRITE_FAILED`; the before-acquisition child executed two `lstatSync` observations and one mutation but resolved instead of returning `RUN_ROOT_UNSAFE`; the after-acquisition child observed only the construction `openSync`, proving the required live acquisition is absent. The existing unsafe-root leaf passed `1/1`, and the affected Artifact Port contract suite passed `198/198`.

The experimental module-mock flag is a test-only Node 26 subprocess invocation; it does not enter production, canonical runner configuration, package metadata, or public behavior. During Test execution the shared worktree was inadvertently switched to the CI branch, which produced non-causal results against baseline production code. Controller detected the Adapter hash mismatch, preserved the authorized test diff, restored `work/macbook/fix-run-root-identity-reuse`, and reran all frozen commands against Adapter SHA-256 `b846c6b6c20535f156ff699c3666d9768984ec23705f4d939032935efa1f654b`; only these corrected results are evidence.

## Required GREEN and Regression

- New mode-`0300` leaf passes on approved macOS and GitHub-hosted Ubuntu.
- New mocked before-acquisition mutation rejects exactly `RUN_ROOT_UNSAFE` and preserves zero writes.
- New mocked after-live-acquisition mutation retains `{ready:true}`, establishing the defined linearization semantics rather than continuous validity.
- Existing unsafe-root leaf, affected Artifact Port contract suite, and `tools/harness/validation/run` pass after Test/Worker gates.
- Exactly one Revision-002 remote Linux proof occurs only after all new local deterministic leaves are GREEN. The invalidated earlier proof does not consume this authorization; no retry of the Revision-002 proof is authorized.

## Revision 002 Local GREEN

Worker and Controller independently established the following against Adapter SHA-256 `dd5ad664d0b83f48497ef8202130cb8899c10243c198774868de3588a76533f0`:

- focused `AC-RRIF-001`: exit `0`, `2/2` pass;
- existing unsafe-root regression: exit `0`, `1/1` pass;
- affected Artifact Port contract: exit `0`, `198/198` pass;
- `tools/harness/validation/run`: exit `0`, including strict TypeScript checking and all canonical offline suites; the one real-Pi acceptance remains intentionally skipped by the canonical no-model gate;
- `git diff --check`: exit `0`; production diff is only `adapters/storage-local/local-analysis.ts`.

The first Worker candidate passed runtime tests but failed canonical TypeScript checking with `TS2366` in the new `catch/finally` control flow. Worker made a semantic-neutral explicit-throw correction in the same Adapter file; Controller reran the full canonical command and accepts only the corrected GREEN evidence above.

## Test Asset Retirement Gate

**PASS.** Controller reconciled the complete test-asset diff with `test-handoff.md`: the existing unsafe-root leaf, new mode-`0300` leaf, and inline two-boundary child-process leaf are permanent regressions with distinct current evidence owners. No fixture, standalone helper, double, snapshot, coverage entry, harness path, temporary evidence, retirement candidate, `skip`, `todo`, or `only` marker was added. Complete-diff `ponytail-review` returned **Lean already. Ship.** The inline child remains the smallest deterministic black-box mechanism that exercises replacement immediately before and immediately after live descriptor acquisition without adding a production seam.

## Revision 002 Ubuntu Proof

Controller created evidence-only draft PR `#6` from frozen formal candidate `e789c49` plus the exact pending CI-governance workflow blob `289ab6238864d49191f4df977f04c9695010c716`. Exactly one `pull_request` run occurred:

- proof head: `a4e04959dd5d478f9fec659a3b0ff37d1e7b38a0`;
- run: `32578873868`, conclusion `success`;
- job: `97045155348` (`Canonical validation`), conclusion `success`;
- started `2026-08-22T14:30:02Z`, completed `2026-08-22T14:30:40Z`;
- PR `#6` is `CLOSED`, remained draft, `mergedAt: null`, `mergeCommit: null`; the proof branch was deleted;
- the formal branch contains no `.github/workflows` change.

No retry occurred. This consumes the one Revision-002 remote-proof authorization.

## Scope and Security Checks

- Test writes only the named integration file; Worker writes only `adapters/storage-local/local-analysis.ts`; final PR has no `.github` change.
- Native numeric `O_SEARCH`/`O_PATH` flags remain private design implementation limited to approved macOS/Linux; no generic platform abstraction.
- No public Port/lifecycle method, marker, registry, fallback, retry, persistent identity record, dependency, data egress, credential, model invocation, or source/Artifact format change.
- Activation remains merge after fresh Validator PASS; rollback is an Adapter revert without user-data rewrite; no retirement/migration behavior is added.

## Ponytail Disposition

**Lean already. Ship it.** Revision 002 contains one pinned descriptor, one per-preflight live descriptor, two native platform flag values, and two black-box tests. Complete-diff consistency review deleted the obsolete learning/proof wording, the contradictory test stop line, deprecated mock option, and temporary-fixture claim. No abstraction, helper, production seam, registry, listener, polling, test hook, public close/dispose API, or workflow/product-scope expansion is permitted.
