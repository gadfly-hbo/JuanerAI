# Verification Intent and Revision 002 Evidence Boundary

## Current verdict

**CONTROLLER TDD_READY — REVISION 002.** Validator rejected the prior implementation/evidence freeze. Revision 002 defines a feasible live-path descriptor acquisition linearization point and preserves permitted owner-write/search-only mode `0300` roots. Test has frozen causal RED in the one allowed integration file; Worker is unlocked only for the one allowed Adapter file.

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

## Scope and Security Checks

- Test writes only the named integration file; Worker writes only `adapters/storage-local/local-analysis.ts`; final PR has no `.github` change.
- Native numeric `O_SEARCH`/`O_PATH` flags remain private design implementation limited to approved macOS/Linux; no generic platform abstraction.
- No public Port/lifecycle method, marker, registry, fallback, retry, persistent identity record, dependency, data egress, credential, model invocation, or source/Artifact format change.
- Activation remains merge after fresh Validator PASS; rollback is an Adapter revert without user-data rewrite; no retirement/migration behavior is added.

## Ponytail Disposition

**Lean already. Ship it.** Revision 002 contains one pinned descriptor, one per-preflight live descriptor, two native platform flag values, and two black-box tests. Complete-diff consistency review deleted the obsolete learning/proof wording, the contradictory test stop line, deprecated mock option, and temporary-fixture claim. No abstraction, helper, production seam, registry, listener, polling, test hook, public close/dispose API, or workflow/product-scope expansion is permitted.
