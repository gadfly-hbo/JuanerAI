# Test Plan

## Test Intent

Prove the exact Run Manifest `2.0` provenance/compatibility delta while preserving the complete Local Analysis Execution and Data Analyst behavior. Tests extend the existing `TEST-XCLI-001..022` identities; they do not add a new business TEST identity, create a second Runtime double, or call a real model/provider.

Production remains frozen at `1ba80d419e79f08f0002d17840c7cad92edc103c` until causal RED and TDD_READY.

## Test Role Isolation

After Spec Gate only, the Test role may change the exact test/fixture paths in `proposal.md`. It cannot edit production, dependencies, current spec/archive, architecture, the canonical runner, project board, or the CSV. The Worker later receives frozen test hashes/counts and cannot edit tests or fixtures.

Any invalid test, unexpected contract need, or production behavior not covered by the approved delta returns to Test Design or Spec. Assertions are not weakened during implementation.

## Minimum Independently Scheduled Assertion Groups

| Group | Existing TEST identity / layer | Required observation |
|---|---|---|
| RPN-T01 | `TEST-XCLI-004` / Unit | Current validation accepts exact `2.0` `in_progress`, `succeeded`, `failed`, and `cancelled` shapes with neutral closed nodes; every terminal copy retains identical provenance. |
| RPN-T02 | `TEST-XCLI-004` / Unit | Independently reject each old Pi-named key, extra/missing/null provenance field, `profile.version`, model duplication/extra field, malformed ID/version, legacy `1.0` at the current-write validator, and unknown schema version. |
| RPN-T03 | `TEST-XCLI-004`, `TEST-XCLI-008` / Unit + Artifact contract | Readable-terminal validation and `readTerminalRun` accept exact `1.0` and `2.0` `succeeded`, `failed`, and `cancelled` records; returned legacy structure is exact and all indexed assets verify. |
| RPN-T04 | `TEST-XCLI-008`, `TEST-XCLI-016`, `TEST-XCLI-018` / Artifact contract + Integration | For each Artifact mutator (`beginRun`, `commitConfirmedContract`, `appendAsset`, `replaceManifest`, `commitSuccess`), legacy `1.0`, legacy `in_progress`, malformed, and unknown-version state is rejected with before/after tree and byte equality; terminal reads never backfill or create files. |
| RPN-T05 | `TEST-XCLI-006`, `TEST-XCLI-011` / Agent contract + Integration | Port method set remains exactly `preflightModel`, `openSession`; preflight returns one deeply frozen exact `{runtime,adapter,model}` readiness object and cached calls do not create a Session/provider effect. |
| RPN-T06 | `TEST-XCLI-011` / Integration module-hook fixture | Production readiness reads SDK `VERSION`; exact `0.84.2` succeeds, while independently missing, null/non-string, malformed, and mismatched versions fail `RUNTIME_UNAVAILABLE` before Session/provider work. No source-string scan substitutes for the module-hook observation. |
| RPN-T07 | `TEST-XCLI-006`, `TEST-XCLI-009`, `TEST-XCLI-011` / Contract + Integration | Requested/preflight model mismatch fails `MODEL_UNAVAILABLE` before Session/run; execution/preflight mismatch fails `MODEL_EXECUTION_FAILED`, publishes no success, and any retained failed run keeps the preflight provenance. |
| RPN-T08 | `TEST-XCLI-009`, `TEST-XCLI-010`, `TEST-XCLI-019` / Integration | Application receives internal Profile `{id:"personal"}`, keeps external Profile config at exactly four fields, composes Application product constants with Adapter readiness, writes only `2.0`, and preserves provenance through success/failure/cancellation. |
| RPN-T09 | `TEST-XCLI-005`, `TEST-XCLI-017`, `TEST-XCLI-018` / Unit + Integration | `analysis-contract.json` and `evidence.json` stay exact schema `1.0`; Evidence/Markdown shapes remain unchanged; product/runtime/Adapter/Profile/model resolution uses same-run `run.json` with no duplicated field. |
| RPN-T10 | `TEST-XCLI-013`, `TEST-XCLI-018` / E2E | CLI/Application public success, failure, and cancellation returns admit/transport current `2.0` provenance exactly; legacy/unknown current Application result is rejected as `CLI_APPLICATION_INVALID`; successful persisted and returned manifests match. |
| RPN-T11 | `TEST-XCLI-006`, `TEST-XCLI-008`, `TEST-XCLI-019`, `TEST-XCLI-022` / Contract + Integration | Agent Runtime and Artifact Port method sets/public module exports remain unchanged; Profile adds no external option; source/dependency scan finds no Application vendor-name branch, new Port method, registry, fallback, migration/repair script, package change, or Pi SDK type outside the Adapter. Observable contract tests remain primary; scans are supporting architecture evidence. |
| RPN-T12 | existing full matrix / all layers | Every unrelated Local Analysis Execution, fixture/oracle, Finding/Evidence, security/egress, timeout/cancellation, atomicity, terminal, and no-retry case remains GREEN; real-model E2E remains gated skip. |

Independent mutation cases SHALL be registered or reported separately so one passing broad title cannot conceal a missed field/version/operation. The Test role records the exact post-RED case/assertion counts required by modified `AC-XTS-003-02`; it does not delete an existing case to preserve historical counts.

## Healthy Expected RED

Before Test dispatch, helper/environment health is the supplied clean baseline. After the Test role edits only its allowed paths:

1. Native syntax and strict typecheck over the changed test graph remain healthy apart from types causally owned by the missing production contract; any isolated pre-Worker type-health method must be documented and may not create a second business contract.
2. Coverage-map identity resolution remains GREEN for the exact current AC and `TEST-XCLI-001..022` identities.
3. Focused current-manifest tests fail because Product Core accepts only `1.0`, requires Pi-named runtime keys, and does not expose bounded legacy terminal read validation.
4. Focused readiness tests fail because `preflightModel` returns only model identity and the Pi Adapter does not observe the loaded SDK `VERSION`.
5. Focused Application/Profile tests fail because Profile identity is not an Application dependency and Application writes hard-coded schema `1.0` provenance.
6. Focused Artifact compatibility tests fail because one validator path serves mutations/read, current code cannot write `2.0`, and it cannot perform the approved exact terminal dual-read/current-only mutation split.
7. Baseline unrelated tests remain healthy and no failure is caused by a broken helper, missing dependency, changed CSV, provider call, or changed environment.

TDD_READY requires exact commands, test hashes, causal failure excerpts, independently scheduled mutation list, post-Test expected counts, coverage identity result, Worker write set, and Test Asset Lifecycle Ledger.

## GREEN and Regression Matrix

| Evidence | Required result |
|---|---|
| Product Core focused Unit | RPN-T01/T02/T03/T09 PASS with exact current/legacy validators and negative matrices |
| Agent Runtime contract | unchanged method set; Pi Adapter and in-memory double both pass closed readiness, model equality, and all prior session behavior |
| Pi local module-hook integration | exact SDK `VERSION` observation/failures PASS; zero Session/provider/credential effect before readiness |
| Application/Profile focused Integration | RPN-T07/T08 PASS for product/Profile/readiness/model flow and all terminal copies |
| Run Artifact contract | real filesystem and double pass current-only mutations, exact dual terminal reads, asset checks, byte preservation, terminal immutability, and all prior atomic behavior |
| CLI/E2E focused | RPN-T10 PASS; exact public/persisted `2.0`; invalid legacy/unknown current results rejected |
| independent artifact schemas | Run `2.0`, Analysis Contract `1.0`, Evidence `1.0`; unchanged Evidence/Markdown projection |
| strict static check | `npm run typecheck` exits `0`, no emit |
| full offline regression | `tools/harness/validation/run` exits `0`; exact new counts recorded; one real-model gated skip; no provider call |
| scope/architecture | diff limited to frozen Test/Worker paths; no package/lock/data/architecture/project-board/user-run changes; no new method/registry/vendor branch/migration |

The unchanged Local Analysis Execution contract suite must run even though its production Adapter is outside the Worker write set, because the Application/Port type delta must not regress it.

## Compatibility and Rollback Evidence

Synthetic temporary run roots—not user run directories—supply exact terminal legacy fixtures. For each supported terminal status, capture the full tree and bytes, call `readTerminalRun({run_id})`, compare the returned manifest/assets, then prove the full tree and bytes are unchanged. For legacy `in_progress`, every mutator, malformed records, and unknown versions, prove rejection plus the same no-change snapshot.

Rollback review confirms the code activation can return to the baseline without deleting or rewriting `1.0` or `2.0` artifacts and without claiming the baseline reader understands `2.0`.

## Test Asset Lifecycle Ledger

At TDD_READY, every changed existing test/fixture/helper is classified as permanent regression coverage with its RPN group and retained consumer. The expected current plan adds no tracked diagnostic helper and retires no existing asset. Any temporary probe belongs in `/private/tmp` and is absent before verification.

After GREEN/regression, the Controller runs the mandatory Test Asset Retirement Gate and `ponytail-review` over the complete test-asset diff, reconciles changed paths/consumers/counts, removes any temporary or ownerless asset through Test-role-only correction, reruns affected regression, and freezes PASS evidence for Validator.

## Forbidden Test Substitutes

- No real model/provider call, user run-directory inspection, package installation, wall-clock assumption, or global Pi mutation.
- No source-string scan as the sole proof of SDK `VERSION`, model observation, Artifact byte preservation, or Port behavior.
- No duplicate test-owned business interface, second Runtime implementation, generic compatibility harness, migration fixture corpus, registry, or production test seam.
- No assertion weakening, legacy normalization, or mutation of a legacy fixture to obtain an expected result.
