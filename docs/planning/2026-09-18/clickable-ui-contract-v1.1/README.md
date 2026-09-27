# Xanthil Desktop Clickable UI Contract v1.1

This is an explicitly simulated UI Contract for the user UI Gate. It directly
composes the accepted PX-2026-006 dual-mode shell with the full interactive
PX-2026-004 professional workbench. It is not production software.

## Run

```bash
cd /Users/huangbo/JuanerAI/docs/planning/2026-09-18/clickable-ui-contract-v1.1/dist
python3 -m http.server 4173
```

Open `http://127.0.0.1:4173/`.

## Source reuse

- `dist/index.html`, `styles.css`, `app.js`, `data.js` start from the accepted
  PX-2026-006 quick/dual-mode Demo bytes.
- `dist/professional/**` starts from the accepted PX-2026-004 complete
  professional-mode Demo bytes.
- The v1.1 composition change replaces PX-006's professional placeholder with
  the complete PX-004 workbench, updates the public term to `循证分析`, and adds
  unmistakable `UI Contract / 模拟` and Preview labels.
- The old independently invented v1.0 clickable draft remains preserved at
  `../clickable-ui-contract/` and is not the design baseline.

Exact source authority and hashes are recorded in
`../xanthil-ui-reference-adoption-map-v1.0.md`.

## Boundary

All files, data, calculations, model calls, Fork/Subagent runs, report writes,
mode memory and persistence shown here are synthetic front-end simulation. The
UI does not read real local files, call a provider, install dependencies, start
a database or prove production behavior.

## Current browser verification

Verified locally on 2026-09-18 with a real Chromium browser:

- 1440x900: quick-mode empty state, quick Session creation, full visible
  Skill/Prompt/Fork/Subagent/report capability row and auxiliary drawer;
- quick/pro mode switching preserves the quick Session state;
- professional mode loads the complete PX-2026-004 workbench and its six
  interactive stages; `数据准备` navigation was exercised inside the embedded
  workbench;
- all professional user-facing `自由分析` labels are now `循证分析`;
- 1366x768: required quick-mode capability controls remained present;
- browser console: 0 errors, 0 warnings;
- network: only eight local static resources for the composed quick and
  professional surfaces.

This is a composition smoke check, not the later full UI Gate. The retained
Demo interactions still use their accepted synthetic retail story in some
detail. The formal v1.1 matrix governs the next targeted case-text and closure
state adaptation; production behavior remains locked.
