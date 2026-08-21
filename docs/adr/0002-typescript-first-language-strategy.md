---
status: accepted
date: 2026-08-21
---

# Use TypeScript as JuanerAI's primary product language

JuanerAI will use TypeScript as the default source language for new Product Core, Application, Ports, infrastructure Adapters, product surfaces, and tests. Python remains the specialist language for analytics, data science, model training, and independent validation behind versioned Ports or contracts. JavaScript remains supported only for controlled compatibility entrypoints, configuration, generated output, one-off tooling, and explicitly approved exceptions; it is not a co-equal default for new core product development.

This choice is driven by JuanerAI's long-term need for closed contracts, state unions, replaceable Ports and Adapters, shared types across CLI/Desktop/Console/API surfaces, and safer cross-module refactoring. Pi's TypeScript source and published declarations reduce impedance at the Pi Adapter, but Pi is supporting evidence rather than an architectural dependency: Pi SDK types remain confined to its Adapter and must not leak into Product Core or Application. Runtime validation remains authoritative at trust boundaries through TypeBox/JSON Schema or equivalent closed validators; static TypeScript types do not replace fail-closed runtime contracts.

The in-progress `xanthil-cli-local-analysis-slice` is an explicit transitional exception. It will finish TASK-006 through TASK-010 on its already approved Node.js `.mjs`, zero-compiler stack, with no additional feature scope. After that Change is accepted and archived, the next Change must migrate Xanthil production code and tests to TypeScript without intentional behavior change and before a second business slice begins. That migration will separately decide native Node `.ts` execution versus compiled output, strictness/project configuration, package exports, test execution, and any temporary `allowJs`/`checkJs` bridge.
