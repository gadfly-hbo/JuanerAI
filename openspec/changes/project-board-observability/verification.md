# Verification

Status: **CONTROLLER VALIDATION PASS / INDEPENDENT VERIFICATION PENDING**.

## Executed Evidence

- `node --test tools/harness/project-board/project-control.test.mjs`: 3 passed, 0 failed.
- `node tools/harness/project-board/status-cli.mjs show`: valid current snapshot, two history events, and one decision brief read successfully.
- HTTP positive paths: health `200`, aggregate state `200`, referenced document `200`.
- HTTP negative paths: POST `405`, invalid Host `400`, invalid Origin `403`, invalid brief ID `400`, missing brief `404`, missing route `404`.
- Playwright Chromium headless probes: 27 checks passed, 0 page errors, observed request methods only `GET`.
- Interactions covered repository sync, decision drawer, recommendation display, constrained document reading, local note persistence, JSON export, clipboard prompt, theme toggle, refresh, semantic buttons, mobile navigation, dialog keyboard focus, Escape close, and reduced-motion behavior.
- Visual inspection passed for desktop dark, desktop light, 390px mobile, and the decision drawer.

## Corrections During Validation

- The first browser probe used an over-specific title expectation; it was corrected to the repository value and rerun.
- Invalid brief requests originally returned generic `503`; the server now distinguishes invalid `400`, missing `404`, and unavailable `503` states.
- Mobile metrics changed from four vertical rows to a compact two-column layout after screenshot inspection.

## Remaining Gate

This is Controller validation, not independent Validator evidence. PB-TASK-008 remains open, so the Change is not accepted or eligible for archive.
