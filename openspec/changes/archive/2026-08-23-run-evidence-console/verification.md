# Verification Read Model: Xanthil Run & Evidence Console

## Current Verdict

`PR_10_CHANGES_REQUESTED_REPAIR_GREEN — AWAITING_INDEPENDENT_VALIDATOR`

This file is the sole current lifecycle-status authority within this OpenSpec package. The original Change remains accepted and archived, but PR #10 delivery was reopened from reviewed head `69ed340116f7daf73e7b5304dae35897eb01541a` for a bounded CHANGES_REQUESTED repair. The Controller-owned project board mirrors the current repair state for observability only; Proposal, Design, Tasks, and traceability retain stable decision, architecture, work, and evidence mappings. No prior Validator verdict covers the repaired implementation.

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

## Current Frozen Evidence

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
