# TASK-006 Worker Handoff — CLI, Personal Profile, and Canonical Example

Date: 2026-08-21  
Change: `xanthil-cli-local-analysis-slice`  
Gate: `TDD_READY_TASK_006` accepted by Controller  
Route: configured `juaner_worker`  
Write risk: medium; one focused test creates only test-owned system-temporary roots

## Objective

Implement the minimum production behavior needed to make the frozen `153`-leaf TASK-006 focused target GREEN: one structured CLI boundary, one Personal Profile composition, and the sole canonical CSV. Do not revise tests or widen the product.

## Sole write ownership

- `apps/cli/xanthil.mjs`
- `profiles/personal/local-analysis.mjs`
- `examples/member-analysis/member-orders-v1.csv`

No other file or directory is writable. In particular tests/helpers, OpenSpec, Product Core, Application, Ports, all Adapters, root manifests/lock/dependencies, project board, global Pi/config/credentials, other examples/surfaces, and external repositories are frozen. The example directory inventory after implementation must contain only the named CSV.

## Required pre-code return

Before editing, provide a constraint matrix covering each brief bullet, authority, implementation location, positive/negative evidence, waiver/blocker, allowed/forbidden actions, and rollback trigger. Confirm there is no contract drift. A true missing Product-Core validator or impossible public seam stops as `CONTRACT_CHANGE_REQUEST_TASK_006`; do not invent a field/code/export.

## CLI implementation contract

- Export exactly `runXanthil`; accept only the closed plain `{input,output,application}` envelope.
- Implement direct Promise-to-frozen-Event one-shot iteration, exact first-question rule, exact event union/state machine, and no ambient stdin/signal/cwd/home/env/command parsing.
- Own the exact frozen canonical source descriptor and pass exactly `{question,source}` to Application.
- Validate closed Application and handle surfaces, complete proposal, complete Product-Core-valid succeeded/failed/cancelled Run Manifest arms, canonical metrics/Finding/source/Evidence/limitations, and exact status/stage/code mappings. Import and use existing Product Core validation; do not duplicate or relax it.
- Never mutate/freeze caller or Application originals. Create referentially distinct recursively frozen closed clones for all CLI output events and resolved results.
- Enforce exact output ordering, confirm/reject/edit/EOF/interrupt behavior, confirmation-vs-one-next-event race, cancellation idempotency, late-success discard, and no CLI Artifact write/retry/compensation.
- Map malformed boundaries only to the five approved CLI rejection codes. Map recognized/unknown Application failures exactly as revised Design specifies, with no raw leakage.
- Stop at every writer failure point exactly as frozen; completed Application effects remain completed.
- Add no export, flag, exit-code API, parser, alternate source/model/provider/root/tool, inspection seam, test mode, RPC, resume/list/delete/repair, Decision/recommendation/Action, or decorative-text contract.

## Personal Profile implementation contract

- Export exactly `createPersonalLocalAnalysisProfile` with the frozen four-field plain configuration and exact provider/model.
- Validate both roots synchronously as existing absolute physical real directories, reject symlink/non-directory/root/equal/relative/nonexistent/unknown/inherited/symbol inputs, and create no directory or file.
- Compose only `createPiAgentAnalysisRuntime`, `createDuckDbPythonLocalAnalysisExecution`, `createLocalRunArtifactStore`, and `createLocalAnalysisApplication` with exact model and a composition-owned clock.
- Return a frozen plain exact `{application}`; no injection/inspection/Adapter object or extra export.
- Import/construction and the tested `application.start -> cancel` pre-Discovery path must cause no run/artifact, source-row read, Pi prompt/session realization, credential/session-file access, provider/network call, output, or ambient fallback.

## Canonical example

Create the exact literal CSV bytes from the approved Specification at `examples/member-analysis/member-orders-v1.csv`: UTF-8 without BOM, LF, one trailing LF, exactly `530` bytes, SHA-256 `c0d1c3d2b1e8621955ab786dc87cebc14437033bda4def397498db5a1544ebb0`. Do not add README, hidden file, copy, metadata, or another CSV.

## Validation and stop budget

- Any number of `node --check` calls on the two changed production `.mjs` files.
- Exact fixture `wc -c` and `sha256` checks are allowed once after writing.
- One and only one full focused command:
  `node --test --test-name-pattern='^TASK-006' tests/integration/xanthil-local-analysis/local-analysis.integration.test.mjs tests/e2e/xanthil-local-analysis/local-analysis.e2e.test.mjs`
- No partial target, helper target, retry, full suite, install/build, real Pi/provider/model command, credential probe, or network call.

Expected acceptance is exactly `153 pass / 0 fail / 0 cancelled / 0 skipped / 0 todo`. Any failure, forbidden-path need, test defect, or contract ambiguity stops immediately with `REVISION_SCOPE_ESCALATION_TASK_006`; make no post-failure edit or rerun.

## Return

Return changed paths/hashes, constraint/evidence matrix, syntax and fixture identity results, the single focused result, exact side-effect/scope statement, and `TASK_006_READY_FOR_CONTROLLER_REVIEW` or the required stop signal. Do not start TASK-008, real Pi acceptance, or Validator.
