# TASK-004 Test Handoff Addendum — Run Artifact Protocol

Status: **FROZEN**  
Controller: Codex  
Date: 2026-08-20  
Origin: Test-role pre-write blocker found that the prior Port commands could not carry a valid initial or final Run Manifest

This addendum supersedes only the TASK-003-regression expectation in `test-task-004-handoff.md`. All ownership, safety, environment, non-goals, and remaining budgets stay frozen.

## Controller Decision

The complete command payloads are now frozen in `design.md`:

- `beginRun({run_id,initial_manifest})`
- `commitConfirmedContract({run_id,contract})`
- `appendAsset({run_id,asset})`
- `replaceManifest({run_id,next_manifest})`
- `commitSuccess({run_id,next_manifest,evidence,summary,evidence_document})`
- `readTerminalRun({run_id})`

There is no partial reservation `run.json`. Application supplies complete Product-Core-valid in-progress, failed/cancelled, and succeeded manifests and explicit run identity on every command. `commitSuccess` publishes the supplied succeeded manifest last after verified Evidence/Markdown bytes. Adapter state cannot infer current run, business time, status, provenance, or missing semantic fields.

The Local Analysis Port deadline is a required integer `0..30`; product Application passes `30`, and a direct Port test using `0` must receive sanitized `TIMEOUT` before process/result work.

## Required Test Correction

- Update test-private Artifact doubles/drivers and existing Application integration assertions to the exact command payloads above.
- Add independently scheduled `TASK-003B` leaves proving complete initial/final manifests, explicit same-run identity on every command, success-manifest-last, cross-run rejection, and no Adapter-assembled semantic fields.
- Because current accepted Application still uses the prior payloads, the one authorized `^TASK-003` execution is now expected RED, not regression GREEN. It must fail only at the corrected Artifact command protocol; helper health remains PASS.
- Continue the original TASK-004 real Adapter suite and one authorized `^TASK-004` RED. It must fail only because the two concrete Adapter modules are absent.
- Do not edit production or compensate for Application. Return two separate RED inventories and root-cause splits.

## Gate Result

If helper health passes and both focused targets are valid as above, return `TEST_READY_FOR_TASK_003B_AND_TASK_004`. Controller must dispatch and accept TASK-003B Application correction before TASK-004 Worker implementation.
