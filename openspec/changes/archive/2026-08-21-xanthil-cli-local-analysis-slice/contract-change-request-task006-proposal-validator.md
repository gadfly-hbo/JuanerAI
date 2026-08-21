# Contract Change Request

## Summary

TASK-006 CLI must validate the complete transient Analysis Proposal before exposing or confirming it, but the existing Product Core interface has no proposal validator. Add one pure Product Core operation so CLI and future product surfaces share the same business-semantic validation instead of duplicating the frozen proposal in each caller.

## Current Contract

- Source: `packages/product-core/local-analysis.mjs` through `createLocalAnalysisDomain()`.
- Meaning and behavior: Product Core validates fixtures, calculations, Findings, Run Manifests, Evidence, terminal outcomes, offline reproduction, Markdown, and security rules. It does not validate the complete Discovery Proposal. Application currently compares Discovery output to its own internal expected proposal; that internal check is not a reusable Product Core interface.

## Proposed Contract

- Meaning and behavior: add exactly one pure operation, `validateAnalysisProposal(proposal)`, to the frozen object returned by `createLocalAnalysisDomain()`. It validates the complete approved first-scenario Proposal—including version, questions, objective, source/fixture identity, windows, metric definitions, signal rule, output requirements, and constraints—without mutation, freezing, defaults, coercion, I/O, time, environment, or infrastructure knowledge.
- Shape: one positional Proposal value in; the same valid value out. No options, dependency, mode, proof surface, second export, or alternate scenario is added.
- Failure semantics: missing/null/non-plain/extra fields, wrong values/order/cardinality, unsupported source/window/metric/signal/output/constraint semantics, or nested contract drift fails closed. Unsupported `schema_version` uses `CONTRACT_VERSION_UNSUPPORTED`; all other invalid Proposal values use `VALIDATION_FAILED`. No raw value or nested cause is exposed.

## Reason and Evidence

The frozen TASK-006 Design requires CLI to validate the complete Application Proposal through Product Core and forbids duplicating or relaxing business validation in `apps/cli`. The TASK-006 Worker confirmed before writing that `createLocalAnalysisDomain()` exposes no such operation and correctly returned `CONTRACT_CHANGE_REQUEST_TASK_006` with its validation budget untouched. The frozen E2E suite independently mutates a missing field, extra field, and semantic value, so a key-only or pass-through check is insufficient.

Placing this behavior in Product Core creates a deeper Module: one small Interface operation concentrates the entire Proposal invariant and can be reused by CLI, future Desktop/Console/API callers, and later Application cleanup. Placing it in CLI would duplicate business knowledge at every product surface and violate dependency locality.

## Affected Domains

| Domain | Impact |
|---|---|
| Product Core | additive closed Interface revision and pure implementation |
| Test Design | new unit positive/negative leaves derived from TEST-XCLI-003/009; expected RED at the missing Core operation |
| CLI | resumes after Core GREEN and calls the approved operation; no duplicated proposal validator |
| Application | no production change in this correction; existing internal validation remains accepted |
| Persistence/Adapters/Profile/dependencies | no change |

## Compatibility

- backward compatible: behavior is additive for callers, but the closed Product Core factory Interface intentionally gains one named operation; exact-surface consumers and tests must recognize the same revision.
- migration or backfill: none; no durable schema or stored value changes.
- activation: Core validator unit GREEN and Controller acceptance are prerequisites before TASK-006 CLI Worker resumes.
- rollback: remove the unactivated operation and its new tests before CLI integration; no data cleanup.
- retirement: after CLI uses it, retirement requires a replacement shared validator and a new contract gate; callers may not inline the invariant.

## Validation

- positive: the exact approved Proposal returns unchanged and remains unmutated/unfrozen when supplied unfrozen.
- negative: independently mutate every top-level and nested invariant family, version, ordering/cardinality, source/window/metric/signal/output/constraint field; each exact failure code is asserted.
- integration: existing TASK-006 invalid-proposal CLI leaves remain RED at the absent CLI seam until the Core operation is GREEN, then the resumed CLI Worker must invoke the public Core operation and make all frozen TASK-006 leaves GREEN.

## Controller Decision

- status: accepted for bounded Spec/Test/Core implementation revision
- rationale: this is the smallest architecture-consistent repair. It restores locality and reuse at the Product Core seam without changing product intent, Application behavior, persistence, dependencies, Profile, data boundary, or current `.mjs` stack. It does not release CLI production until the new shared operation is separately test-first and GREEN.
