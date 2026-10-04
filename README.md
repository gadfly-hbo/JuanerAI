# JuanerAI

JuanerAI is a commercial AI decision product family for data analysts and enterprise decision users. Its intended loop is:

Data -> Decision -> Action -> Outcome

Xanthil is the first JuanerAI product. Existing JuanerAI features and foundations remain reusable; the current approved product-development sequence is indexed in [Planning](docs/planning/README.md).

## Current State

The repository retains its approved Xanthil CLI local-analysis slice, TypeScript migration, Model Pack contract-enabler and reusable Product Core/Application/Port/Adapter/Profile boundaries.

On 2026-09-18 the user made all pending Xanthil Desktop and Model Pack development plans **VOID**. See [the current planning decision](docs/planning/README.md). Use the current approved Blueprint and applicable execution input; withdrawn plans and historical reviews do not restore execution authority.

## Start Here

- [Whitepaper and product strategy](docs/product/whitepaper/README.md): canonical product source and adopted version history.
- [Research results](docs/research/README.md): Demo references, exact source identities and production-adoption boundaries.

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
