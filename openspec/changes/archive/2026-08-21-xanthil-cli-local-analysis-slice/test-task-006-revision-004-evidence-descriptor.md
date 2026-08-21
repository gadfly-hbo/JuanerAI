# TASK-006 Test Revision 004 — Evidence Descriptor Authority

Date: 2026-08-21  
Owner: Controller  
Role: configured `juaner_test`

## Conflict

The E2E leaf labelled `wrong evidence descriptor` changes a successful manifest's Evidence SHA to `'0'.repeat(64)`. That value remains a valid SHA shape. The canonical digest is computed from dynamic Evidence bytes containing `run_id`; those bytes are not part of the CLI Application result, and Product Core's Run Manifest contract authorizes only exact `evidence.json` path plus SHA shape. The current leaf therefore has no approved CLI/Core oracle.

## Required correction

Change only `tests/e2e/xanthil-local-analysis/local-analysis.e2e.test.mjs`. Keep the same leaf label, TEST/AC identity, expected `CLI_APPLICATION_INVALID`, effect assertions, scheduling, and all other tests. Change only its mutation from a different valid-looking SHA to a wrong Evidence descriptor path, such as `run.evidence.path = 'other-evidence.json'`. This remains an independently executable wrong-Evidence-descriptor negative and is rejected by the existing authoritative `validateRunManifest` operation. Do not add a new helper, oracle, field, Product Core expectation, or Application surface.

## Validation budget

- Any number of `node --check` calls on the changed E2E file.
- Exactly one complete focused expected RED using the original TASK-006 command over the integration and E2E files.
- No partial/helper/full-suite/production/Pi/model/network/dependency command.

Expected pre-implementation result remains `153` scheduled tests: `1` helper PASS and `152` failures split only across absent CLI `127`, absent Profile `24`, and absent canonical CSV `1`, with zero cancelled/skipped/todo. Return file hash, exact counts/split, and `TDD_READY_TASK006_REVISION_004`, or a genuine conflict. Do not start Worker or Validator.
