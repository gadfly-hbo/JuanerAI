# TASK-006 Test Revision 005 — Run Identity and Profile Realpath

Date: 2026-08-21  
Owner: Controller  
Role: configured `juaner_test`

## Allowed writes

Only:

- `tests/e2e/xanthil-local-analysis/local-analysis.e2e.test.mjs`
- `tests/integration/xanthil-local-analysis/local-analysis.integration.test.mjs`

Production, fixtures/helpers, other tests, OpenSpec, board, manifests/dependencies, credentials/global Pi, and external paths are frozen.

## Required corrections

1. Preserve the E2E `wrong manifest run ID` leaf, its label, TEST/AC identity, expected `CLI_APPLICATION_INVALID`, scheduling, and effects. Replace its different but valid UUID with a malformed run identity so the existing authoritative `validateRunManifest` can reject it. Do not add a CLI-side expected-ID oracle or new product surface.
2. Preserve all Profile contracts and negatives. Canonicalize only the successful Profile test roots to physical `realpath` before passing them as `workspaceRoot`/`runRoot`: both the existing non-TASK-006 Profile composition test and `createTask006Roots` used by the focused TASK-006 Profile tests. Import/use the existing Node filesystem realpath API in the test file. Do not relax production, skip on macOS, special-case `/var`, or alter symlink/non-directory/root/equality negatives.

No other test source may change.

## Validation budget

- Any number of `node --check` calls on the two changed files.
- Exactly one complete original TASK-006 focused execution against the preserved production candidate.
- No partial/helper/full-suite/production/Pi/model/network/dependency command.

Expected result: `153` scheduled, `145` pass, `8` fail, zero cancelled/skipped/todo. The only remaining failures must be two outer Application nullish classifications, three invalid Proposal boundary mappings, and three progress-writer confirm-effect assertions. Return exact file hashes/counts/failure split and `TDD_READY_TASK006_REVISION_005`, or a genuine conflict. Do not start Worker or Validator.
