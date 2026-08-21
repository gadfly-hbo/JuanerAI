# Verification

Status: **INDEPENDENT VALIDATOR PASS / CONTROLLER ACCEPTED / ARCHIVED**.

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

## Fresh Independent Verification

On 2026-08-21, the fresh Sol-high read-only Validator returned **BASE PASS**
for PB-REQ-001..005 and PB-AC-001..005. It independently reproduced the base
3/3 and consolidated 12/12 Node suites, loopback HTTP positive and negative
paths, repository-backed `show`, and a clean Playwright session with zero
console errors/warnings and GET-only network traffic. It verified that helper,
base test, server, browser, README, and schemas are unchanged.

PB-REQ-004 is accepted with the separately approved and independently passed
`project-board-status-authority` narrowing: complete candidates validate before
write; status and brief publish atomically; a later event append is one
best-effort attempt whose I/O failure returns success with the frozen warning
and never rolls back publication.

## Acceptance

Controller accepts the base Change on 2026-08-21. All requirements, tests,
scope, read-only boundaries, rollback behavior, and independent evidence are
closed. The accepted current specification is merged with the PBSA narrowing;
archive is authorized. No Git commit or push is implied.

## Archive

The accepted base contract, with PB-REQ-004 narrowed by PBSA, was merged into
`openspec/specs/project-board/spec.md`. This Change moved to
`openspec/changes/archive/2026-08-21-project-board-observability/` on
2026-08-21. No Git commit or push was performed.
