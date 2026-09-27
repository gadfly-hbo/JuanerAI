# Xanthil Accepted UI Reference Plates v1.0

These plates are self-contained review input for the clickable UI Contract.
They preserve representative accepted PX-2026-004/006 screens without making
the research repository a runtime or review dependency.

## Plates

| File | Accepted product mode demonstrated | Required reuse |
|---|---|---|
| `01-professional-analysis.png` | PX-004 professional workbench, six-stage bar, Project/Session rail, hypotheses, child tasks, Composer capabilities and Inspector | Layout hierarchy, professional workflow, state density and right-side context |
| `02-professional-report.png` | PX-004 evidence-linked report | Report as a first-class stage with evidence links and right-side context |
| `03-professional-feedback.png` | PX-004 execution-feedback stage | Decision/feedback as a visible stage; adapt action labels to the v1.0 Closure contract |
| `04-quick-empty.png` | PX-006 quick/pro switch, quick Session empty state and auxiliary drawer | Top-level dual-mode shell and conversation-first quick mode |
| `05-quick-analysis.png` | PX-006 quick analysis, Composer capabilities and provenance drawer | Skill/Prompt/Fork/Subagent/report placement and visible data boundary |
| `06-fork-reflow.png` | PX-006 independent Fork conversation and manual reflow | Child-conversation hierarchy, frozen inherited scope, return path and reflow status |
| `07-subagent-background.png` | PX-006 Subagent/background task while viewing professional mode | Background continuation and return entry across modes |
| `08-report-adoption.png` | PX-006 reflow/adoption and report version chain | Reflow-versus-adoption separation and superseded report history |

## Allowed adaptation

- Replace the retail narrative and synthetic values with the first-slice
  membership-repurchase Case.
- Rename all user-visible `自由分析` labels to `循证分析`.
- Improve wording, spacing, contrast, focus treatment and responsive fit while
  retaining the same product hierarchy and capability locations.
- Replace Demo guide/failure switches and fake OS chrome with normal product
  controls or explicit UI Gate tooling outside the main product surface.
- Label non-activated quick/Fork/Subagent/general capability behavior
  `Preview · 模拟`.

## Not allowed

- Replacing the accepted UI with a new wizard, dashboard or unrelated shell.
- Using the PX-006 professional placeholder instead of the complete PX-004
  professional workbench.
- Removing quick/pro mode, child conversations, Skill, Prompt, Inspector/drawer,
  report/history or execution-feedback visibility to simplify the case.
- Treating screenshot pixels, Demo DOM, Mock IDs or timers as production
  contracts.

The exact source bytes and authority split are recorded in
`../../xanthil-ui-reference-adoption-map-v1.0.md`.
