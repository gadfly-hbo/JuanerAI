# Xanthil CLI MVP Readiness

## Confirmed

- Product: Xanthil CLI.
- Parent project: JuanerAI.
- Primary users: data analysts and enterprise decision users.
- Role: AI data-analysis assistant and foundation for later decision automation.
- Runtime direction: Pi behind an Adapter.
- Product loop: Data -> Decision -> Action -> Outcome.
- Delivery direction: local-first and enterprise-ready.

## Not Yet Frozen

- First concrete business question and industry context.
- Supported input data forms, volume, quality, and sensitivity.
- Required analysis methods and Domain Pack.
- Required model behavior and Model Pack.
- Exact Ontology entities, relationships, states, and actions.
- CLI workflow and output contract.
- Meaning of Action in the MVP.
- Success measures and acceptance scenarios.
- TypeScript/Python process and protocol boundary.
- Pi and Semantica versions and integration modes.

## Entry Gate

The Controller must ask the user for the detailed Xanthil plan before creating the first behavior-changing Change. The gate passes only when the items above are resolved or explicitly deferred with safe defaults.

## First Change

No first Change is created during cold start. It will be selected from the detailed plan as the smallest end-to-end user-valued Decision Loop, not as a generic infrastructure build.

