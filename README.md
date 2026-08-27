# JuanerAI

JuanerAI is a commercial AI decision product family for data analysts and enterprise decision users. Its intended loop is:

Data -> Decision -> Action -> Outcome

Xanthil is the first JuanerAI product. Its current product direction is desktop-first for macOS and Windows; continued CLI product development is paused while the approved CLI local-analysis behavior remains a compatibility baseline. Enterprise capability remains future work.

## Current State

The repository has an approved Xanthil CLI local-analysis slice and reusable Product Core/Application/Port/Adapter/Profile boundaries. The current Controller candidate revises the product roadmap toward Xanthil Desktop and a later two-phase Model Pack; it does not activate a Desktop Profile or authorize a new product Change.

The next product gate is completion of the fresh Development-Readiness Review and explicit user approval of the [`2026-08-27` planning package](docs/planning/2026-08-27/README.md). After that, the static Desktop Demo is reviewed before any productization Change.

## Start Here

- AGENTS.md: engineering constitution and stop lines.
- CONTEXT.md: product language.
- Orchestration.md: Controller-Domain Isolation.
- docs/product/product-brief.md: current product intent.
- docs/planning/README.md: current and historical product-plan authority.
- docs/architecture/system-context.md: system boundaries.
- .ai-coding/workflow.md: OpenSpec, SDD, and TDD flow.
- openspec/changes/README.md: Change requirements.

## Repository Areas

- apps/: user and operator product surfaces.
- packages/: infrastructure-independent core, contracts, and pack SDKs.
- adapters/: replaceable infrastructure implementations.
- profiles/: composition roots for deployment modes.
- openspec/: current behavior specifications and active changes.
- .ai-coding/: durable AI engineering governance.
- docs/: product, architecture, contracts, governance, and decisions.
- tests/: executable verification organized by level.
- tools/harness/: future deterministic gate automation.
