# Verification Read Model: Xanthil Run & Evidence Console

## Current Verdict

`INDEPENDENT_VALIDATOR_PASS — AWAITING_MACBOOK_FINAL_REVIEW`

This file is the sole current lifecycle-status authority within this OpenSpec package. The original Change remains accepted and archived, but PR #10 delivery was reopened from reviewed head `69ed340116f7daf73e7b5304dae35897eb01541a` for a bounded CHANGES_REQUESTED repair. The Controller-owned project board mirrors the current repair state for observability only; Proposal, Design, Tasks, and traceability retain stable decision, architecture, work, and evidence mappings. The current independent Validator PASS is bound only to fixed implementation/evidence head `a06e8df3bf568da6379140d520782cbe96dcda81`; no earlier verdict is reused.

The user accepted REC-CONTRACT-004 after the fresh Validator confirmed the prior version, outer-view, identity-order, and pre-read-size mechanisms but found three gaps. The approved decision keeps runtime output, the result envelope, and provenance exact and closed; it defers only complete TypeScript closure for nested Artifact-derived View values and status-specific detail. The two remaining behavior obligations were Finding empty-content classification as `RUN_READ_FAILED` and real-Profile propagation of indexed pre-read `byte_size` mismatch as `RUN_CHECKSUM_MISMATCH`. Both now pass causal tests through the existing Core, local Adapter, and Application boundaries. Regression, Test Asset Retirement, the required independent role, and R2 Sol/high validation are frozen PASS; no module, shared codec, Runtime abstraction, framework, size cap, or new path was added.

## Accepted Authority and Frozen Scope

- REC-CONTRACT-001, REC-CONTRACT-002, REC-CONTRACT-003, and REC-CONTRACT-004 are accepted; no other Artifact, writer, Runtime, Profile, CLI, package, or shared-path change is authorized.
- The only production repair paths remain `apps/console/xanthil-console.ts`, `packages/application/run-evidence-query.ts`, `packages/product-core/run-evidence.ts`, `packages/ports/run-evidence-reader.ts`, `adapters/storage-local/run-evidence-reader.ts`, and `profiles/personal/console.ts`.
- The only test repair paths remain the eight REC-CONTRACT-002 paths plus REC-CONTRACT-003's named `TEST-XCLI-021` path; `tsconfig.json` remains conditional for its exact 14-path append only.
- Existing Core reuse remains Run Manifest/Evidence Index validation; reader Core owns exact persisted confirmed-contract admission. New viewer provenance is Artifact-`1.0`-only and creates no Runtime replacement/registry/fallback/second-Runtime contract.

## Reopened Gate Conditions

| Gate / condition | Owner | Release evidence |
|---|---|---|
| R2 REC-CONTRACT-004 Spec re-review | Controller / Sol high | `PASS`; bounded `gpt-5.6-sol` / high read-only review returned `SPEC_GATE_RECOMMEND_PASS` with no findings |
| Reopened Spec Gate | Controller | `PASS`; REC-CONTRACT-004 CCR, ACs, Design, Test Plan, traceability, and `Lean already. Ship.` complexity review are frozen for Test |
| Corrected Test Design / RED | Test role | `TDD_READY`; R2 review confirmed 69 pass / 8 fail from exactly five causal leaves plus three parent tests: three Finding empty-content leaves, Application checksum propagation, and real-Profile pre-read size mismatch; typecheck and static checks pass |
| Repaired Worker GREEN | Worker | `PASS`; minimum three-file production diff is `+6/-5`, focused Console is `77/77`, and R2 Worker review returned `WORKER_GREEN` |
| Regression / retirement | Controller | `PASS`; typecheck, TEST-XCLI-021, canonical offline, node checks, complete nine-path lifecycle ledger, and `Lean already. Ship.` review pass; seventeen deferred static guards are retired with no current consumer |
| Independent validation | Validator | `PASS`; required read-only Validator and final R2 `gpt-5.6-sol` / high gate both returned `VALIDATION_PASS` with no load-bearing finding |
| Acceptance / archive | Controller | `ACCEPTED`; user explicitly approved Acceptance and archive; publication and exact package move are authorized |

## Required Repaired Evidence

- Controlled temporary-workspace snapshot covers selected Run and outside paths; success fixture declares nonexistent/unreadable `sources[].path`; no mutation or source dereference.
- An unaccepted manifest path produces no second-file read/atime probe; manifest-indexed assets retain exact declared `byte_size` plus SHA checks, while core analysis-contract/Evidence descriptors remain SHA-only.
- Non-`1.0` `schema_version` in each named `run.json`, `analysis-contract.json`, and `evidence.json` independently maps to `RUN_CONTRACT_UNSUPPORTED`; fatal UTF-8 and duplicate object members at every depth, closed confirmed-contract nested field/enum/format/cross-reference defects, empty Finding statement/limitations/limitation text, unknown Evidence fields, and invalid Finding status map to `RUN_READ_FAILED`.
- Only shape-valid duplicate/foreign/dangling/wrong-kind/unresolvable relationships map to `RUN_REFERENCE_INVALID`; declared core SHA and indexed asset size/SHA mismatches map to `RUN_CHECKSUM_MISMATCH`.
- E2E renders accepted SQL/Python/JSON/Markdown as labelled escaped inert `<pre>` display text, never numeric byte arrays or executable content.

## REC-CONTRACT-004 Frozen Evidence (Historical)

- Controller focused Console suite: `77/77` PASS.
- Root `npm run typecheck`: PASS.
- REC-CONTRACT-003 successor TEST-XCLI-021: `1/1` PASS and remains the sole exact 35-file TypeScript graph oracle.
- `tools/harness/validation/run`: PASS; the approved real-Pi acceptance leaf remains skipped by the offline runner.
- All eight Console test/fixture/helper assets: `node --check` PASS.
- Test Asset Retirement Gate: PASS; all nine Change-level test paths have current consumers, the duplicate TEST-REC-010 graph block retains TEST-XCLI-021 as successor, and the REC-CONTRACT-004 static-only guards are retired without removing runtime or contract evidence.
- Production repair: exactly three approved files, `+6/-5`; no type expansion, Runtime/Pi/vendor contract, shared codec, size cap, dependency, write capability, or new file.
- `git diff --check`: PASS.

## Accepted Residual Boundary

REC-CONTRACT-004 deliberately defers complete TypeScript closure for nested Artifact-derived View values and status-specific detail. The personal local Profile remains trusted-local and does not promise hostile-resource limits or concurrent-writer isolation; neither boundary is implemented or implied by Console `1.0`.

## Acceptance and Archive

The user explicitly accepted `run-evidence-console` and authorized archive. Controller published the complete new capability to `openspec/specs/run-evidence-console/spec.md` at SHA-256 `baccf416b829565035651607c5443087314467df400d3e6dd9632cc95f08ed3b` and merged REC-CONTRACT-001/002 into the current `openspec/specs/local-analysis/spec.md` at SHA-256 `af3de7c1b4b3f4212328e2a7b73702df1a2c5f152900cbefadc677187c7410de`.

The complete Change package moved without deletion to `openspec/changes/archive/2026-08-23-run-evidence-console/`; the active Change path is absent. Post-archive `tools/harness/validation/run` exited `0`, including strict typecheck and all approved deterministic suites; the gated real-Pi leaf remained skipped and no model/provider call occurred. Project control is `complete` at phase `8/8` with every milestone completed. Delivery remains a separate Git step: commit, push, and review-only PR creation are not part of archive and remain unperformed until an explicit `$juanerai-mini 交付` command.

## Post-Archive Mainline Integration Addendum

During the explicitly authorized Mac mini delivery on 2026-08-23, `origin/main` had advanced through the accepted Runtime provenance neutralization Change. Its current local-analysis contract and shared terminal reader reject legacy Artifact `1.0 in_progress` without terminal projection. The initial merge therefore produced a causal Console RED only for the two assertions that previously expected the `abandoned candidate` projection; success, failed, and cancelled behavior remained compatible after selecting the mainline terminal-read validator and preserving an explicit legacy-`1.0` Console fixture.

The user explicitly accepted REC-CONTRACT-005. Current Console `AC-REC-003-02` now rejects legacy Artifact `1.0 in_progress` as `RUN_READ_FAILED`; only `failed` and `cancelled` yield `verified_non_success`. The archived pre-integration package above remains the historical Acceptance record; `contract-change-request-in-progress-alignment.md` and this addendum record the later delivery-time compatibility decision and its fresh merge evidence.

Fresh post-decision integration evidence is GREEN: focused Console `77/77`, root typecheck, TEST-XCLI-021 `1/1`, all fourteen Console production/test/fixture `node --check` targets, `git diff --check`, and the canonical offline validation runner all pass. No test asset was added or retired; the existing Console fixture now explicitly projects the reused current-writer fixture back to the Artifact `1.0` contract it owns.

## PR #10 CHANGES_REQUESTED Repair Addendum

The repair preserves every accepted schema, version, ownership, Runtime-neutral provenance, and REC-CONTRACT-005 status decision. It makes only these delivery corrections:

- restore `.agents/skills/git-commit-push/SKILL.md` exactly to `origin/main`, removing that governance change from the PR #10 product diff without rewriting its prior Git history;
- render each retained non-success asset descriptor as escaped inert JSON metadata through the existing loopback Console, without exposing retained asset bytes as completed content;
- resolve JSON Pointer object tokens only through own JSON-document properties, so `/toString` and `/constructor` are rejected as `RUN_REFERENCE_INVALID` when absent from the output document; and
- compare `mtime` and `ctime` across the existing bounded file read in addition to device, inode, and size, so observable same-inode/same-size instability is `RUN_READ_FAILED` without a watcher, lock, retry, or new abstraction.

TDD evidence was causal and public-seam based. Before production repair, the retained-descriptor HTTP E2E was `0/1`, the real-Profile observable-instability case was `0/1`, and the two prototype-pointer leaves both failed inside TEST-REC-003 (`22` pass / `3` fail including the parent). After the minimum repair, those targeted runs are respectively `1/1`, `1/1`, and `25/25` PASS.

Fresh Controller evidence on the complete repaired worktree is: focused Console `81/81` PASS; root typecheck PASS; TEST-XCLI-021 `1/1` PASS; all fourteen Console production/test/fixture paths pass `node --check`; canonical offline validation PASS with the real-Pi leaf skipped; and `git diff --check` PASS. The Test Asset Retirement Gate is PASS with three new permanent regression leaves inside existing test files and no new fixture, helper, double, snapshot, harness, coverage-map entry, or TEST identity. The bounded repair ponytail review is `Lean already. Ship.`

This evidence is Controller/regression evidence only. Independent Validator is still required against the new pushed head; the former Validator PASS is historical and must not be reused. Acceptance is not reasserted for the repaired head, PR #10 must not be merged from Mac mini, and the next lifecycle action is independent read-only validation.

## Fixed-head `8427c0ac` Validator Repair Addendum

The independent Validator returned `CHANGES_REQUESTED` against `8427c0ac1a31bc6a0e77f951d40536de5833d3cb` for exactly two bounded findings. The repair preserves every previously passed behavior and makes only these corrections:

- JSON Pointer array tokens now require the target array to own the canonical numeric property before resolution. A causal TEST-REC-003 leaf sets `Array.prototype[0]` inside `try/finally`; before repair the empty-array `/items/0` reference was incorrectly admitted, and after the one-condition Core repair it is `RUN_REFERENCE_INVALID`. The prior `/toString` and `/constructor` leaves remain passing.
- The existing coverage inventory now maps TEST-REC-005 to AC-REC-005-03 for observable same-inode/same-size instability and TEST-REC-009 to AC-REC-003-02 for retained descriptor rendering. TEST-REC-010 asserts both leaves, and the Test Plan, traceability, and retirement ledger are reconciled without inventing an AC or TEST identity.

Fresh Controller evidence is: targeted TEST-REC-003/010 `27/27` PASS; TEST-REC-005 `10/10` PASS; TEST-REC-009 `3/3` PASS; complete focused Console `82/82` PASS; root typecheck PASS; changed-path `node --check` PASS; canonical offline validation PASS with the real-Pi leaf skipped; Test Asset Retirement PASS; and `git diff --check` PASS. The bounded ponytail review is `Lean already. Ship.`

This addendum supersedes the prior fixed-head Validator verdict only for delivery state. GitHub Canonical validation must rerun against the new pushed head, followed by a new independent read-only Validator. Mac mini does not merge PR #10.

## Independent Validator PASS Addendum

The independent read-only Validator returned `PASS` against fixed implementation/evidence head `a06e8df3bf568da6379140d520782cbe96dcda81`. It confirmed that both findings from the `8427c0ac1a31bc6a0e77f951d40536de5833d3cb` review are closed: JSON Pointer array indexes require an own array property, and TEST-REC-005 / TEST-REC-009 coverage ownership is consistent across the executable coverage map, traceability, and Test Asset Retirement ledger.

Validator evidence on that fixed head is complete focused Console `82/82` PASS and root typecheck PASS. GitHub Canonical validation run [32610573916](https://github.com/gadfly-hbo/JuanerAI/actions/runs/32610573916) is `SUCCESS` with `head_sha=a06e8df3bf568da6379140d520782cbe96dcda81`.

The Validator host used Node `25.9.0` and had no DuckDB, so the Validator did not rerun the local canonical command. This disclosed environment limitation is neither a waiver nor a blocker: the exact reviewed SHA has the independent focused/typecheck evidence above and the successful GitHub Canonical run. All prior `CHANGES_REQUESTED`, `69ed340`, `8427c0ac`, `77/77`, and `81/81` records remain intact as historical evidence.

Current verdict: `INDEPENDENT_VALIDATOR_PASS — AWAITING_MACBOOK_FINAL_REVIEW`. This does not claim that PR #10 has been merged; Mac mini stops before merge.

## OpenSpec and Governance Consistency Audit

This audit covers both the prior PR #10 repair and the fixed-head `8427c0ac` follow-up. Proposal, Design, archived delta specifications, published Requirements, and Acceptance Criteria are byte-unchanged from the fixed head; no normative contract was revised to fit implementation. Tasks append only the delivery-repair checklist, while Test Plan, traceability, Test Asset Retirement, and this verification addendum reconcile the already accepted TEST/AC ownership.

Older `69ed340`, `77/77`, and `81/81` records remain only inside their named historical sections. The fixed-head addendum above is the sole current local evidence count at `82/82`; current repair evidence uses the reviewed SHA and stable TEST/AC identities rather than mutable code-line anchors. The pre-Spec ponytail line references are explicitly historical review coordinates, not live implementation evidence.

Project control remains `validating` at phase `7/8`, with independent validation completed and Validator complete. Its current metrics are seven Console Requirements, `82/82` focused tests, four of four local repair tasks complete, and five accepted REC decisions; EVD identifiers are contiguous from EVD-001 through EVD-080. GitHub Canonical and the independent Validator PASS are both bound to fixed implementation/evidence head `a06e8df3bf568da6379140d520782cbe96dcda81`. No current risk, blocker, or user decision is open; the next action is MacBook final review and an authorized squash merge only. Mac mini does not merge PR #10.

The complete PR diff contains no change to `AGENTS.md`, Git workflow governance, or `.agents/skills/git-commit-push/SKILL.md`. No provider/model invocation, dependency installation, reset, rebase, force-push, or merge occurred.
